// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./Roles.sol";
import "./Ownable.sol";

contract Farmer is Ownable{

    event _renounceFarmer(address _address, string _message);
    event _removeFarmer(address _address, string _message);
    event _addFarmer(address _address, string _message);

    Roles.Role internal farmer;
    
    mapping(address => string) public name_f; //from address to firm name
    mapping(string => string) public seat_f; //from name to seat

    // define a function that allow to potential farmer to sign up
    function addFarmer_signup(string memory _name, string memory _seat) public{
        require(!Roles.has(farmer, msg.sender), "You are already signed-up"); //here to prevent an oracle call, I need to check 
        //icontact_oracle.get_info(_seat);
        Roles.add(farmer, msg.sender);
        name_f[msg.sender] = _name;
        seat_f[_name] = _seat;
        emit _addFarmer(msg.sender, "A farmer has been signed up");
    }

    // define a function that allow the Owner to add a farmer account (to use only for rare cases)
    // here we don t call the contact_oracle(personal choice)
    function addFarmer(address _address, string memory _name, string memory _seat) public onlyOwner {
        Roles.add(farmer, _address);
        name_f[_address] = _name;
        seat_f[_name] = _seat;
        emit _addFarmer(_address, "A farmer has been added by Owner");
    } 

    // define a function that allow a Farmer to renounce the effective role of Farmer
    function renounceFarmer() external onlyFarmer {
        Roles.remove(farmer, msg.sender); // Role function
        //delete seat_f[name_f[msg.sender]];
        //delete name_f[msg.sender];
        emit _renounceFarmer(msg.sender, "A farmer has renounced");
    }

    // define a function that allow the Owner to remove a farmer that commits unlawful acts
    function removeFarmer(address _address) public onlyOwner {
        Roles.remove(farmer, _address); // Role function
        //delete seat_f[name_f[_address]];
        //delete name_f[_address];
        emit _removeFarmer(_address, "A farmer has been removed");
    }

    // define a modifier that checks if an address corresponds effectively to a Farmer
    modifier onlyFarmer() {
        require(Roles.has(farmer, msg.sender), "Not allowed, you're not a farmer");
        _;
    }

    // Define a function 'isFarmer' to check this role
    function isFarmer(address _address) public view returns (bool) {
        return Roles.has(farmer, _address);
  }
}
