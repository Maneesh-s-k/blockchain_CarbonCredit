// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) external view returns (bool);
}

contract CarbonCreditToken is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Strings for uint256;
    
    // ZK-SNARK verifier contracts
    IVerifier public immutable carbonCreditVerifier;
    IVerifier public immutable transferVerifier;
    
    // Carbon credit structure
    struct CarbonCredit {
        uint256 carbonAmount;
        uint256 energyAmount;
        bytes32 projectHash;
        uint256 timestamp;
        bool verified;
        bool retired;
        string projectType;
        string location;
        uint256 vintage;
    }
    
    // Struct to avoid stack too deep
    struct MintParams {
        address to;
        uint256 carbonAmount;
        uint256 energyAmount;
        bytes32 projectHash;
        string projectType;
        string location;
        uint256 vintage;
        string uri;
    }
    
    struct ZKProof {
        uint[2] a;
        uint[2][2] b;
        uint[2] c;
        uint[] input;
    }
    
    // Mappings
    mapping(uint256 => CarbonCredit) public carbonCredits;
    mapping(address => uint256) public carbonBalances;
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(address => bool) public authorizedMinters;
    mapping(bytes32 => bool) public commitments;
    
    // Events
    event CreditMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 carbonAmount,
        uint256 energyAmount,
        bytes32 projectHash
    );
    
    event CreditVerified(uint256 indexed tokenId, bool verified);
    event CreditRetired(uint256 indexed tokenId, address indexed by);
    event PrivateTransfer(
        bytes32 indexed nullifierHash, 
        bytes32 indexed senderCommitment,
        bytes32 indexed receiverCommitment
    );
    event CommitmentRegistered(bytes32 indexed commitment, address indexed user);
    
    // Counters
    uint256 private _tokenIdCounter;
    
    constructor(
        address _carbonCreditVerifier,
        address _transferVerifier
    ) ERC721("CarbonCredit", "CC") {
        carbonCreditVerifier = IVerifier(_carbonCreditVerifier);
        transferVerifier = IVerifier(_transferVerifier);
    }
    
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }
    
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
    }
    
    /**
     * @dev Mint carbon credits with ZK proof verification (STRUCT VERSION)
     */
    function mintCarbonCredit(
        MintParams memory params,
        ZKProof memory proof
    ) external onlyAuthorizedMinter nonReentrant {
        // Verify ZK proof
        require(
            carbonCreditVerifier.verifyProof(proof.a, proof.b, proof.c, proof.input),
            "Invalid carbon credit ZK proof"
        );
        
        _processMinting(params, proof.input);
    }
    
    /**
     * @dev Simple mint function for testing (without structs)
     */
    function mintCarbonCreditSimple(
        address to,
        uint256 carbonAmount,
        uint256 energyAmount,
        bytes32 projectHash,
        string memory projectType,
        string memory location,
        uint256 vintage,
        string memory uri,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) external onlyAuthorizedMinter nonReentrant {
        // Verify ZK proof
        require(
            carbonCreditVerifier.verifyProof(a, b, c, input),
            "Invalid carbon credit ZK proof"
        );
        
        // Extract verified values from public outputs
        require(input.length >= 2, "Invalid proof outputs");
        uint256 verifiedCarbonCredits = input[0];
        uint256 validProof = input[1];
        
        require(validProof == 1, "Proof validation failed");
        require(carbonAmount <= verifiedCarbonCredits, "Carbon amount exceeds verified amount");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Create credit
        carbonCredits[tokenId] = CarbonCredit({
            carbonAmount: carbonAmount,
            energyAmount: energyAmount,
            projectHash: projectHash,
            timestamp: block.timestamp,
            verified: true,
            retired: false,
            projectType: projectType,
            location: location,
            vintage: vintage
        });
        
        carbonBalances[to] += carbonAmount;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit CreditMinted(to, tokenId, carbonAmount, energyAmount, projectHash);
        emit CreditVerified(tokenId, true);
    }
    
    /**
     * @dev Internal function to process minting (reduces stack depth)
     */
    function _processMinting(MintParams memory params, uint[] memory input) internal {
        // Extract verified values from public outputs
        require(input.length >= 2, "Invalid proof outputs");
        uint256 verifiedCarbonCredits = input[0];
        uint256 validProof = input[1];
        
        require(validProof == 1, "Proof validation failed");
        require(params.carbonAmount <= verifiedCarbonCredits, "Carbon amount exceeds verified amount");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Create credit
        carbonCredits[tokenId] = CarbonCredit({
            carbonAmount: params.carbonAmount,
            energyAmount: params.energyAmount,
            projectHash: params.projectHash,
            timestamp: block.timestamp,
            verified: true,
            retired: false,
            projectType: params.projectType,
            location: params.location,
            vintage: params.vintage
        });
        
        carbonBalances[params.to] += params.carbonAmount;
        
        _safeMint(params.to, tokenId);
        _setTokenURI(tokenId, params.uri);
        
        emit CreditMinted(params.to, tokenId, params.carbonAmount, params.energyAmount, params.projectHash);
        emit CreditVerified(tokenId, true);
    }
    
    /**
     * @dev Private transfer using ZK-SNARKs
     */
    function privateTransfer(
        bytes32 nullifierHash,
        bytes32 senderCommitment,
        bytes32 newSenderCommitment,
        bytes32 receiverCommitment,
        bytes32 merkleRoot,
        ZKProof memory proof
    ) external nonReentrant {
        require(!usedNullifiers[nullifierHash], "Nullifier already used");
        require(commitments[senderCommitment], "Invalid sender commitment");
        
        require(
            transferVerifier.verifyProof(proof.a, proof.b, proof.c, proof.input),
            "Invalid transfer ZK proof"
        );
        
        _processTransfer(nullifierHash, senderCommitment, newSenderCommitment, receiverCommitment, proof.input);
    }
    
    /**
     * @dev Simple private transfer function (without structs)
     */
    function privateTransferSimple(
        bytes32 nullifierHash,
        bytes32 senderCommitment,
        bytes32 newSenderCommitment,
        bytes32 receiverCommitment,
        bytes32 merkleRoot,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) external nonReentrant {
        require(!usedNullifiers[nullifierHash], "Nullifier already used");
        require(commitments[senderCommitment], "Invalid sender commitment");
        
        require(
            transferVerifier.verifyProof(a, b, c, input),
            "Invalid transfer ZK proof"
        );
        
        _processTransfer(nullifierHash, senderCommitment, newSenderCommitment, receiverCommitment, input);
    }
    
    /**
     * @dev Internal function to process transfer
     */
    function _processTransfer(
        bytes32 nullifierHash,
        bytes32 senderCommitment,
        bytes32 newSenderCommitment,
        bytes32 receiverCommitment,
        uint[] memory input
    ) internal {
        require(input.length >= 2, "Invalid transfer proof outputs");
        uint256 validTransfer = input[0];
        uint256 verifiedNullifier = input[1];
        
        require(validTransfer == 1, "Transfer validation failed");
        require(uint256(nullifierHash) == verifiedNullifier, "Nullifier mismatch");
        
        usedNullifiers[nullifierHash] = true;
        commitments[senderCommitment] = false;
        commitments[newSenderCommitment] = true;
        commitments[receiverCommitment] = true;
        
        emit PrivateTransfer(nullifierHash, senderCommitment, receiverCommitment);
    }
    
    /**
     * @dev Register a commitment for private transfers
     */
    function registerCommitment(bytes32 commitment) external {
        commitments[commitment] = true;
        emit CommitmentRegistered(commitment, msg.sender);
    }
    
    /**
     * @dev Retire carbon credits (permanent removal from circulation)
     */
    function retireCredit(uint256 tokenId, string memory /* reason */) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!carbonCredits[tokenId].retired, "Already retired");
        
        CarbonCredit storage credit = carbonCredits[tokenId];
        credit.retired = true;
        carbonBalances[msg.sender] -= credit.carbonAmount;
        _burn(tokenId);
        
        emit CreditRetired(tokenId, msg.sender);
    }
    
    /**
     * @dev Get carbon credit details
     */
    function getCreditDetails(uint256 tokenId) external view returns (
        uint256 carbonAmount,
        uint256 energyAmount,
        bytes32 projectHash,
        uint256 timestamp,
        bool verified,
        bool retired,
        string memory projectType,
        string memory location,
        uint256 vintage
    ) {
        CarbonCredit memory credit = carbonCredits[tokenId];
        return (
            credit.carbonAmount,
            credit.energyAmount,
            credit.projectHash,
            credit.timestamp,
            credit.verified,
            credit.retired,
            credit.projectType,
            credit.location,
            credit.vintage
        );
    }
    
    /**
     * @dev Get user's carbon balance
     */
    function getCarbonBalance(address user) external view returns (uint256) {
        return carbonBalances[user];
    }
    
    /**
     * @dev Check if nullifier has been used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
    
    /**
     * @dev Check if commitment is valid
     */
    function isCommitmentValid(bytes32 commitment) external view returns (bool) {
        return commitments[commitment];
    }
    
    /**
     * @dev Get total supply of tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Batch mint multiple carbon credits (simple version)
     */
    function batchMintCarbonCredits(
        address[] memory recipients,
        uint256[] memory carbonAmounts,
        uint256[] memory energyAmounts,
        bytes32[] memory projectHashes,
        string[] memory projectTypes,
        string[] memory locations,
        uint256[] memory vintages,
        string[] memory uris
    ) external onlyAuthorizedMinter nonReentrant {
        require(recipients.length == carbonAmounts.length, "Array length mismatch");
        require(recipients.length <= 50, "Batch size too large");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            carbonCredits[tokenId] = CarbonCredit({
                carbonAmount: carbonAmounts[i],
                energyAmount: energyAmounts[i],
                projectHash: projectHashes[i],
                timestamp: block.timestamp,
                verified: true,
                retired: false,
                projectType: projectTypes[i],
                location: locations[i],
                vintage: vintages[i]
            });
            
            carbonBalances[recipients[i]] += carbonAmounts[i];
            
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);
            
            emit CreditMinted(recipients[i], tokenId, carbonAmounts[i], energyAmounts[i], projectHashes[i]);
            emit CreditVerified(tokenId, true);
        }
    }
    
    // OpenZeppelin v4 override functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
