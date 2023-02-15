// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./Roles.sol";
import "./Ownable.sol";

// more or less the contract is very similar to the Farmer one (all explanation about functions,modifiers... are there)
contract Retailer is Ownable{


    event _renounceRetailer(address _address, string message);
    event _removeRetailer(address _address, string message);
    event _addRetailer(address _address, string message);
    
    Roles.Role internal retailer;

    mapping(address => string) public name_r; //restituisce nome dell azienda
    mapping(string => string) public seat_r; // dal nome alla sede
    
    modifier onlyRetailer(){
        require(Roles.has(retailer, msg.sender), "Not allowed, you're not a retailer");
        _;
    }

    function renounceRetailer() external onlyRetailer{
        Roles.remove(retailer, msg.sender);
        //delete seat_r[name_r[msg.sender]];
        //delete name_r[msg.sender];
        emit _renounceRetailer(msg.sender, "A retailer has renounced");
    }
    
    function removeRetailer(address _address) public onlyOwner{
        Roles.remove(retailer, _address);
        //delete seat_r[name_r[_address]];
        //delete name_r[_address];
        emit _removeRetailer(_address, "A retailer has been removed");
    }

    function addRetailer(address _address, string memory _name, string memory _seat) public onlyOwner{
        Roles.add(retailer, _address);
        name_r[_address] = _name;
        seat_r[_name] = _seat;
        emit _addRetailer(_address, "A retailer has been added by Owner");
    }

    function addRetailer_signup(string memory _name, string memory _seat) public{
        require(!Roles.has(retailer, msg.sender), "You are already singup"); //here to prevent an oracle call, I need to check 
        Roles.add(retailer, msg.sender);
        name_r[msg.sender] = _name;
        seat_r[_name] = _seat;
        emit _addRetailer(msg.sender, "A farmer has been signed up");
    }

    // Define a function 'isRetailer' to check this role
    function isRetailer(address _address) public view returns (bool) {
        return Roles.has(retailer, _address);
  }
}