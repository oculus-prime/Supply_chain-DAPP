// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import '@chainlink/contracts/src/v0.8/ChainlinkClient.sol';

interface ISupply_chain{
    function postcode_definition(uint _postcode, string memory _seat) external; 
}

contract Contact_oracle is ChainlinkClient{ // to interact with external API: inherit ChainlinkClient
    using Chainlink for Chainlink.Request;
    
    mapping(bytes32 => string) private id_to_seat;
    address private immutable supply_chain;
    address private immutable oracle; // oracle address that will perform the set of instructions
    bytes32 private immutable jobId; // sequence of bytes that represents the instruction to be performed
    uint private immutable fee;
    ISupply_chain private Isupply_chain;

    /* to this chainlink node oracle we ask to perform these instructions (called also adapters)
    -http get (get a string here)
    -jsonParse (describe the path of json data)
    -ethTx (encode payload to perform an ETH tx and so submit to the chain)
    */
    constructor (address _oracle,
            //bytes32 _jobId,
            address _link,
            address _supply_chain){
                require(_link!=address(0),'Wrong Link Token Address');
                setChainlinkToken(_link);
                // I hardcorde just the jobId
                jobId = "ca98366cc7314957b8c012c72f05aeeb";
                oracle = _oracle;
                fee = 10 * 10**16; // each request to an oracle chainlink on testnet costs 0.1 Link (1 Link = 1e18 Jul);
                supply_chain = _supply_chain;
            }


    // now I make a chainlink request to retrieve API json data to which Im interested
    function get_info(string memory _seat) public{
        // since there is no len method for string data type:
        require(bytes(_seat).length != 0, 'Seat not valitd');
        // now we instantiate the request
        // fulfill.selector specifies automatically on which function we receive the data by the callback
        // function performed by the oracle
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        // now we sepcify some details to my request
        // insert the URL where will be performed the get, we perform a concatenation
        string memory ll = string(abi.encodePacked("https://api-adresse.data.gouv.fr/search/?q=", _seat));
        request.add("get", ll);
        // specify the path to find the desired data
        request.add("path", "features,0,properties,postcode");
        request.addInt("times", 1); // this jobid expect also a multiplication task, but we don't care, so we set 1
       // we send the request and simultaneously we save this id for the next purpose: mapping 
        id_to_seat[sendChainlinkRequestTo(oracle,request,fee)] = _seat;
    }

    // receive the response in the consumer contract, that can be farmer, distributor, retailer
    function fulfill(bytes32 _id, uint _postcode) public
    recordChainlinkFulfillment(_id){ // this modifier ensure if _id and caller are valid
        Isupply_chain = ISupply_chain(supply_chain);
        Isupply_chain.postcode_definition(_postcode, id_to_seat[_id]);// we successfully add an instance of postcode mapping
    }
}