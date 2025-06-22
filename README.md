## deployment_link for demo  (this is the main one) ->https://energyexchange.vercel.app<- (frontend)  https://energyexchange.onrender.com (backend) 

##please cover all the data in .env before finalizing readme

####################################################################


##backend/.env 

###### Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
###### Database MongoDB
MONGODB_URI=mongodb+srv://mnshdakiti:Blockchain@cluster0.jdidxyo.mongodb.net/energy-trading-prod?retryWrites=true&w=majority&appName=EnergyTradingApp
###### JWT
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c5f7a8b8e8e8e8e8e8e8e8e8e8e8e8e8e
JWT_EXPIRE=2d
###### Blockchain Configuration 
INFURA_PROJECT_ID=e9f45b5ac11648cbab735fc0f755096c
PRIVATE_KEY=81509845d16e59a63d60a4624ce5d0c6252b7419607a4842cf442bcc600339f9
CONTRACT_ADDRESS=0x8Fe6546400dbc5dB4A8Cd2480B21813559000077
VERIFIER_CONTRACT_ADDRESS=0x37F65eA35f61eB60B93b3f3738a175940a43D140
OWNER_PVT_KEY=81509845d16e59a63d60a4624ce5d0c6252b7419607a4842cf442bcc600339f9
DEVICE_PVT_KEY=d81b5a2d10936f7407101c4c4a2f8e7cff7c291040524d4cc659b01fc6454157
GENERAL_ACCOUNT_PVT_KEY=64d7f6df5577913d1b009e7bbf0830f5e31d3d83c8b624c2320a86aa935059ae
###### ZK Proof
ZK_PROOF_KEY=./circuit_final.zkey
###### Google OAuth 
GOOGLE_CLIENT_ID=895233801682-d4dhc1v328o9k1b843tc6re8cqkb6vul.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
###### Email Configuration 
MAILERSEND_API_KEY=mlsn.d08871034bb68b64bf54d1cf93e61a27d5df1cc7b9a3293f8f6d2553c316265b
MAILERSEND_FROM_EMAIL=noreply@test-zxk54v879m1ljy6v.mlsender.net
###### Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
###### Development Settings
DISABLE_EMAILS=false

####################################################################

##frontend/.env 

 
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_APP_NAME=Energy Trading Platform
REACT_APP_GOOGLE_CLIENT_ID=895233801682-d4dhc1v328o9k1b843tc6re8cqkb6vul.apps.googleusercontent.com
REACT_APP_CARBON_CREDIT_TOKEN=0xCa33F82670f4fB196CEDe4741F6045983893f0df
REACT_APP_MARKETPLACE=0x533FCA53FB28A56695Ae12D0524bE25dC08C3D9E
REACT_APP_VERIFIER_CARBON=0xC82DE1f1336810c00e43e22150493946272d7D13
REACT_APP_VERIFIER_TRANSFER=0xf44B74671E536265D69372a80f9ffC1F060bE2F3
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/e9f45b5ac11648cbab735fc0f755096c
REACT_APP_BLOCK_EXPLORER=https://sepolia.etherscan.io


#####   please mention the contracts can be verified on sepolia testnet and also tech stack etc
