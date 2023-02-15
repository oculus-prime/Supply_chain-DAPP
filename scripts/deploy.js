// We require the Hardhat runtime environment explicitly

const { hre, ethers } = require("hardhat");



async function main(){
    const [deployer] = await ethers.getSigners();
    console.log('The deployer/owner of the contract is', await deployer.getAddress())

    const Supply_chain = await ethers.getContractFactory("Supply_chain");
    const supply_chain = await Supply_chain.deploy();

    await supply_chain.deployed();
    console.log('This is the address of my deployed contract: ', supply_chain.address)

    // We need to save artifacts also in /src React directory, so:
    saveToReact(supply_chain)
}

function saveToReact(supply_chain){
    const fs = require('fs');
    const path = require('path');
    new_directory = path.join(__dirname, "..", "frontend", "src", "contracts" )

    if (!fs.existsSync(new_directory)){  // we check if directory already exists
        fs.mkdirSync(new_directory)
    }

    fs.writeFileSync(
        path.join(new_directory, "contract_address.json"),
        JSON.stringify({Supply_chain: supply_chain.address}, undefined, 2)
    )
    
    const Supply_chainArtifact = artifacts.readArtifactSync('Supply_chain');


    fs.writeFileSync(
        path.join(new_directory, "Supply_chain.json"),
        JSON.stringify(Supply_chainArtifact, null, 2),
    )

}

// To cath any errors
main().catch((error) => {
    console.error(error);
    // 1 means 'There is a problem'
    process.exitCode = 1;
});
  
