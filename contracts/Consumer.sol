// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./Roles.sol";
import "./Ownable.sol";

contract Consumer is Ownable{

    event _removeConsumer(address _address, string _message);
    event _addConsumer(address _address, string message);

    Roles.Role internal consumer;
    
    // all people con be consumers 
    function addConsumer() public {
        Roles.add(consumer, msg.sender);
        emit _addConsumer(msg.sender, "New consumer");
    }

    // define a modifier that checks if an address corresponds to a consumer
    modifier onlyConsumer() {
        require(Roles.has(consumer,msg.sender), "First you must register as a consumer ");
        _;
    }

    // the Owner can remove a consumer who behaves unlawfully
    function removeConsumer(address _address) public onlyOwner{
        Roles.remove(consumer,_address);
        emit _removeConsumer(_address, "A consumer has been removed");
    }

    // Define a function 'isDistributor' to check this role
    function isConsumer(address _address) public view returns (bool) {
        return Roles.has(consumer, _address);
    }



}