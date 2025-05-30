// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CarbonCreditToken.sol";

contract CarbonCreditMarketplace is ReentrancyGuard, Ownable {
    CarbonCreditToken public immutable carbonCreditToken;
    IERC20 public paymentToken;
    
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 pricePerCredit;
        uint256 amount;
        bool active;
        uint256 createdAt;
        string projectType;
        uint256 vintage;
    }
    
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public userListings;
    
    uint256 public listingCounter;
    uint256 public platformFeePercent = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    address public feeRecipient;
    
    event ListingCreated(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 pricePerCredit,
        uint256 amount
    );
    
    event ListingCancelled(uint256 indexed listingId);
    
    constructor(address _carbonCreditToken) {
        carbonCreditToken = CarbonCreditToken(_carbonCreditToken);
        feeRecipient = msg.sender;
    }
    
    function createListing(
        uint256 tokenId,
        uint256 pricePerCredit,
        uint256 amount
    ) external nonReentrant {
        require(carbonCreditToken.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(pricePerCredit > 0, "Price must be positive");
        require(amount > 0, "Amount must be positive");
        
        // Get credit details
        (
            uint256 carbonAmount,
            ,
            ,
            ,
            bool verified,
            bool retired,
            string memory projectType,
            ,
            uint256 vintage
        ) = carbonCreditToken.getCreditDetails(tokenId);
        
        require(verified, "Credit not verified");
        require(!retired, "Credit already retired");
        require(amount <= carbonAmount, "Amount exceeds credit balance");
        
        uint256 listingId = listingCounter++;
        
        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            pricePerCredit: pricePerCredit,
            amount: amount,
            active: true,
            createdAt: block.timestamp,
            projectType: projectType,
            vintage: vintage
        });
        
        userListings[msg.sender].push(listingId);
        
        // Transfer token to marketplace for escrow
        carbonCreditToken.transferFrom(msg.sender, address(this), tokenId);
        
        emit ListingCreated(listingId, tokenId, msg.sender, pricePerCredit, amount);
    }
    
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not listing owner");
        require(listing.active, "Listing not active");
        
        listing.active = false;
        
        // Return token to seller
        carbonCreditToken.transferFrom(address(this), msg.sender, listing.tokenId);
        
        emit ListingCancelled(listingId);
    }
    
    function setPaymentToken(address _paymentToken) external onlyOwner {
        paymentToken = IERC20(_paymentToken);
    }
    
    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Fee too high");
        platformFeePercent = _feePercent;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
    
    function getMarketStats() external view returns (
        uint256 totalListings,
        uint256 activeListings,
        uint256 totalVolume,
        uint256 averagePrice
    ) {
        uint256 activeCnt = 0;
        uint256 totalVol = 0;
        uint256 totalValue = 0;
        
        for (uint256 i = 0; i < listingCounter; i++) {
            if (listings[i].active) {
                activeCnt++;
                totalVol += listings[i].amount;
                totalValue += listings[i].amount * listings[i].pricePerCredit;
            }
        }
        
        return (
            listingCounter,
            activeCnt,
            totalVol,
            activeCnt > 0 ? totalValue / totalVol : 0
        );
    }
    
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }
    
    function getActiveListing(uint256 listingId) external view returns (Listing memory) {
        require(listingId < listingCounter, "Invalid listing ID");
        return listings[listingId];
    }
}
