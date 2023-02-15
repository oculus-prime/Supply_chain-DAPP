const { ethers, network, supply_chain } = require("hardhat"); 
const {expect, assert} = require("chai")
const { BigNumber } = require("ethers");
const { time } = require("@nomicfoundation/hardhat-network-helpers"); // to manipulate time of hardhat newtork
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
// anyValue is a predicate that I can use in chai assertion
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace"); // add automatically by hardhat


function catch_unique_id(x){  //I write this function/predicate to catch the unique id to be used later
    globalThis.unique_id = x.toNumber();
    return ethers.BigNumber.isBigNumber(x);
}

function new_price_computation(weight, price, wanted_weight){
    let price_tobe_paid
    if (wanted_weight>weight){
        price_tobe_paid=price
        wanted_weight = weight
    }
    else {
        proportion = (weight * 100) / price;
        price_tobe_paid = ((100*wanted_weight)/proportion).toFixed(6)
    }
    return (Math.round(wanted_weight), price_tobe_paid.toString())
}

describe("Supply chain", function () {
    // using fixture
    async function deployFixture(){
        // getSigners generates 20 accounts...for the moment we need three
        var weight = 30;
        var price = '33'; 
        var product_name = 'tomatoes';
        // in Hardhat network we have up to 20 accounts
        const [owner, account1, account2, account3, account4] = await ethers.getSigners();
         // we want the supply_chain abstraction used to deploy new supply_chain instances
        const Supply_chain = await ethers.getContractFactory("Supply_chain");  
        const supply_chain = await Supply_chain.deploy(); // trigger deployment 
        // check if deplyoment is ended
        await  supply_chain.deployed();
        // consider these variable useful for my tests
        return {supply_chain, weight, price, product_name, owner, account1, account2, account3, account4};
    }

    // we define nested describe calls
    describe("createProduct function", function (){
        
        it("Should fail because owner is not a farmer", async function () {
            const {supply_chain, weight, price, product_name, owner} = await loadFixture(deployFixture);
            await expect(supply_chain.connect(owner) // we use connect to specify the account sends transactions, the default is owner
               .createProduct(weight, ethers.utils.parseEther(price), product_name))
               .to.be.revertedWith("Not allowed, you're not a farmer");
        })

        it("Should emit proper event (manufactured)", async function() {
            const {supply_chain, weight, price,product_name, owner, account1} = await loadFixture(deployFixture);
            await supply_chain.connect(owner).addFarmer(owner.address, 'name', 'seat'); 
            await expect(supply_chain.connect(owner)
                .createProduct(weight, ethers.utils.parseEther(price), product_name)).
                to.emit(supply_chain, "_Manufactured").
                withArgs(anyValue, owner.address);
        }) 
        
        it("Should update storage variable (mapping_m) properly", async function () {
            const {supply_chain, weight, price,product_name, owner, account1} = await loadFixture(deployFixture);
            await supply_chain.connect(owner).addFarmer(owner.address, 'name', 'seat');
            await expect(supply_chain.connect(owner)
                .createProduct(weight, ethers.utils.parseEther(price), product_name)).
                to.emit(supply_chain, "_Manufactured").
                withArgs(catch_unique_id, owner.address);
            const struct_product_m = await supply_chain.mapping_m(unique_id);
            expect(struct_product_m).not.to.be.equal(0);
            expect(struct_product_m.weight_kg).to.be.equal(weight);
        })

    })

    // using another fixture for the second step of this testing
    async function deployFixture_2(){
    const {supply_chain, weight, price,product_name, owner, account1, account2, account3} = await loadFixture(deployFixture);
    await supply_chain.connect(owner).addFarmer(owner.address, 'name', 'seat');
    await expect(supply_chain.connect(owner)
            .createProduct(weight, ethers.utils.parseEther(price), product_name)).
            to.emit(supply_chain, "_Manufactured").
            withArgs(catch_unique_id, owner.address);
    const struct_product_m = await supply_chain.mapping_m(unique_id)
    const weight_of_the_product = await struct_product_m.weight_kg
    const price_of_the_product = ethers.utils.formatEther(struct_product_m.price)
    await supply_chain.connect(owner).addDistributor(account1.address, 'name');
    return {supply_chain, owner, account1, account2, account3, weight_of_the_product, price_of_the_product};
    }
    
    describe("buy_D_product function", function (){
        it("Should fail since this unique_id doesn't exist", async function (){
            let price_tobe_paid
            const {supply_chain, owner, account1, weight_of_the_product, price_of_the_product} = await loadFixture(deployFixture_2);
            let quantity_to_buy_in_kg = 10;
            quantity_to_buy_in_kg, price_tobe_paid = new_price_computation(weight_of_the_product, price_of_the_product, quantity_to_buy_in_kg)
            let unique_id = ethers.constants.One
            await expect(supply_chain.connect(account1).buy_D_product(quantity_to_buy_in_kg, unique_id, ethers.utils.parseEther(price_tobe_paid),
                                                                                                    {value: ethers.utils.parseEther(price_tobe_paid)})).
                to.be.revertedWith("You cant buy a product that's not manufactured");
        })

        it("Should fail since the offer by distributor is not sufficient", async function (){
            let price_tobe_paid
            const {supply_chain, owner, account1, weight_of_the_product, price_of_the_product} = await loadFixture(deployFixture_2);
            let quantity_to_buy_in_kg = 10;
            quantity_to_buy_in_kg, price_tobe_paid = new_price_computation(weight_of_the_product, price_of_the_product, quantity_to_buy_in_kg)
            await expect(supply_chain.connect(account1).buy_D_product(quantity_to_buy_in_kg, unique_id, ethers.utils.parseEther(price_tobe_paid), 
                                                                                                {value: ethers.utils.parseEther('2')})).
               to.be.revertedWith("need more cash");
        })
        
        it("Should fail since the product available to the manufacturer is finished", async function (){
            let price_tobe_paid
            const {supply_chain, owner, account1, weight_of_the_product, price_of_the_product} = await loadFixture(deployFixture_2);
            let quantity_to_buy_in_kg = 30;
            quantity_to_buy_in_kg, price_tobe_paid = new_price_computation(weight_of_the_product, price_of_the_product, quantity_to_buy_in_kg)
            await supply_chain.connect(account1).buy_D_product(quantity_to_buy_in_kg, unique_id, ethers.utils.parseEther(price_tobe_paid),
                {value: ethers.utils.parseEther(price_tobe_paid)});
            let quantity_to_buy_2 = 10;
            quantity_to_buy_2, price_tobe_paid = new_price_computation(weight_of_the_product, price_of_the_product, quantity_to_buy_2)
            await expect(supply_chain.connect(account1).buy_D_product(quantity_to_buy_2, unique_id, ethers.utils.parseEther(price_tobe_paid),
                {value: ethers.utils.parseEther('50')})).to.be.reverted;
        })

        it("Check if price parameter is updated correctly", async function (){
            let price_tobe_paid
            const {supply_chain, owner, account1, weight_of_the_product, price_of_the_product} = await loadFixture(deployFixture_2);
            let quantity_to_buy_in_kg = 10;
            quantity_to_buy_in_kg, price_tobe_paid = new_price_computation(weight_of_the_product, price_of_the_product, quantity_to_buy_in_kg)
            let name_distributor = await supply_chain.name_d(account1.address);
            await supply_chain.connect(account1).buy_D_product(quantity_to_buy_in_kg, unique_id, ethers.utils.parseEther(price_tobe_paid),
                {value: ethers.utils.parseEther(price_tobe_paid)});
            let new_price = '1600.0'
            await supply_chain.connect(account1).available_d(unique_id, ethers.utils.parseEther(new_price));
            let struct_distr = await supply_chain.mapping_d(unique_id, name_distributor);
            expect(ethers.utils.formatEther(struct_distr.price)).to.be.equal(new_price);
        })
    })


    async function deployFixture_3(){
        const {supply_chain,owner, account1, account2, account3, weight_of_the_product, price_of_the_product} = await loadFixture(deployFixture_2);
        let price_tobe_paid;
        let  quantity_to_buy_in_kg = 10;
        quantity_to_buy_in_kg, price_tobe_paid = new_price_computation(weight_of_the_product, price_of_the_product, quantity_to_buy_in_kg)
        supply_chain.connect(account1).buy_D_product(quantity_to_buy_in_kg, unique_id, ethers.utils.parseEther(price_tobe_paid),
            {value: ethers.utils.parseEther(price_tobe_paid)});
        await supply_chain.connect(owner).addRetailer(account2.address, 'name','seat');
        const name_distributor = await supply_chain.name_d(account1.address);
        return {supply_chain, owner, account1, account2, name_distributor, account3};
    }

    // Now we test the buy_R_product function, but being very similar to the previous function, 
    // this test will be more brief
    describe("Buy_R_product", function (){
        it("Should fail because product not available yet", async function (){
            const {supply_chain, owner, account1, account2, name_distributor} = await loadFixture(deployFixture_3);
            let price_tobe_paid;
            let quantity_to_buy_in_kg = 5;
            let struct_distr = await supply_chain.mapping_d(unique_id, name_distributor)
            quantity_to_buy_in_kg, price_tobe_paid = new_price_computation(struct_distr.weight_kg, ethers.utils.formatEther(struct_distr.price), quantity_to_buy_in_kg )
            await expect(supply_chain.connect(account2).buy_R_product(quantity_to_buy_in_kg, unique_id, ethers.utils.parseEther(price_tobe_paid), name_distributor,
                {value: ethers.utils.parseEther(price_tobe_paid)})).to.be.revertedWith("This distributor'product is not yet available");
        })

    })

    describe("Test final code", function(){
        async function deployFixture_4 (){
            let price_tobe_paid;
            const {supply_chain, owner, account1, account2, name_distributor, account3} = await loadFixture(deployFixture_3);
            await supply_chain.connect(account1).available_d(unique_id, ethers.utils.parseEther('50'));
            let struct_product_d = await supply_chain.mapping_d(unique_id, name_distributor);
            let price = ethers.utils.formatEther(struct_product_d.price);
            let quantity_to_buy_in_kg = 10 ; 
            quantity_to_buy_in_kg, price_tobe_paid = new_price_computation(struct_product_d.weight_kg, price, quantity_to_buy_in_kg)
            await supply_chain.connect(account2).buy_R_product(quantity_to_buy_in_kg, unique_id,  ethers.utils.parseEther(price_tobe_paid),name_distributor,
                {value: ethers.utils.parseEther(price_tobe_paid)});
            const name_retailer = await supply_chain.name_r(account2.address);
            await supply_chain.connect(account2).is_ready(unique_id, ethers.utils.parseEther('60'));
            return {supply_chain, owner, account1, account2, account3, name_retailer};
        }

        it("Should fail since the consumer didn't register", async function (){
            const {supply_chain, owner, account1, account2, account3, name_retailer} = await loadFixture(deployFixture_4);
            let price_tobe_paid;
            let struct_product_r = await supply_chain.mapping_r(unique_id, name_retailer);
            let price = ethers.utils.formatEther(struct_product_r.price);
            let quantity_to_buy_in_kg = 1;
            quantity_to_buy_in_kg, price_tobe_paid = new_price_computation(struct_product_r.weight_kg, price, quantity_to_buy_in_kg);
            await expect(supply_chain.connect(account3).final_buy(quantity_to_buy_in_kg, unique_id, ethers.utils.parseEther(price_tobe_paid), name_retailer,
                {value: ethers.utils.parseEther(price_tobe_paid)})).to.be.reverted;
        })

        it("Check the spoiled modifier works properly", async function(){
            const {supply_chain, owner, account1, account2, account3, name_retailer} = await loadFixture(deployFixture_4);
            let price_tobe_paid;
            let quantity_to_buy_in_kg = 1;
            let struct_product_r = await supply_chain.mapping_r(unique_id, name_retailer);
            let price = ethers.utils.formatEther(struct_product_r.price);
            quantity_to_buy_in_kg, price_tobe_paid = new_price_computation(struct_product_r.weight_kg, price, quantity_to_buy_in_kg);
            // we manipulate the time, increasing of 10 days, 
            // with time.increaseTo, mines a new block whose timestamp is the argument of the function
            // time.latest() returns the timestamp of the last block
            const ten_days_in_secs = 60*60*10*24;
            await time.increaseTo((await time.latest()) + ten_days_in_secs);
            await supply_chain.connect(account3).addConsumer();
            await expect(supply_chain.connect(account3).final_buy(quantity_to_buy_in_kg, unique_id, ethers.utils.parseEther(price_tobe_paid), name_retailer,
                {value: ethers.utils.parseEther(price_tobe_paid)})).to.be.revertedWith('This product is spoiled');
        })
    
    })


})


