# 📜 Decentralized Diploma Issuance Platform

Welcome to a revolutionary way to issue and verify academic credentials on the blockchain! This project enables universities to mint NFTs representing diplomas on the Stacks blockchain, allowing employers to instantly verify authenticity without relying on centralized intermediaries like transcript services.

## ✨ Features

🏫 University registration and authorization for secure minting  
🎓 Mint unique NFTs for diplomas with embedded metadata (e.g., degree type, GPA, graduation date)  
👨‍🎓 Student identity management to link real-world info to on-chain records  
🔍 Instant verification of diploma ownership and details by anyone  
🚫 Revocation mechanism for handling errors or fraud  
💰 Fee system for sustainable platform operations  
📋 Customizable credential templates for different degree programs  
🛡️ Audit logs for transparency and compliance  

## 🛠 How It Works

This platform uses 8 smart contracts written in Clarity to handle various aspects of diploma issuance and verification. Here's a high-level overview:

### Smart Contracts Overview
- **UniversityRegistry.clar**: Manages registration of universities as authorized minters. Only verified institutions can issue diplomas.
- **StudentIdentity.clar**: Handles student profiles, linking wallet addresses to personal details (hashed for privacy).
- **DiplomaNFT.clar**: Core NFT contract for minting, transferring, and burning diploma tokens.
- **VerificationContract.clar**: Provides read-only functions to verify diploma authenticity, ownership, and metadata.
- **CredentialTemplate.clar**: Defines templates for different credentials (e.g., Bachelor's, Master's) to standardize metadata.
- **RevocationList.clar**: Tracks revoked diplomas and prevents their verification.
- **FeeManagement.clar**: Collects and distributes small fees for minting to fund platform maintenance.
- **AuditLog.clar**: Logs all key actions (e.g., mints, revocations) for immutable auditing.

**For Universities**  
- Register your institution via UniversityRegistry.  
- Use CredentialTemplate to set up degree formats.  
- Mint a diploma NFT with DiplomaNFT, providing student details and metadata.  
- Pay a nominal fee through FeeManagement.  
- If needed, revoke via RevocationList (e.g., for issuance errors).  

**For Students**  
- Claim your diploma NFT by linking your identity in StudentIdentity.  
- Transfer or hold the NFT in your wallet—it's yours forever!  
- Share your wallet address or NFT ID for verification.  

**For Employers/Verifiers**  
- Call VerificationContract with the NFT ID to instantly check details like issuer, graduate info, and revocation status.  
- Use AuditLog for deeper transparency if required.  

That's it! No more waiting for official transcripts—blockchain ensures trust and speed.