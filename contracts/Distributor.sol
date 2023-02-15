// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./Roles.sol";
import "./Ownable.sol";

// more or less the contract is very similar to the Farmer one (all explanation about functions,modifiers... are there)
// here I don t implement the oracle call since the seat and so the postcode of the distributor dont interest us.
contract Distributor is Ownable{

    event _renounceDistributor(address _address, string _message);
    event _removeDistributor(address _address, string _message);
    event _addDistributor(address _address, string _message);

    Roles.Role internal distributor;

    mapping(address => string) public name_d; //restituisce nome dell azienda

    modifier onlyDistributor(){
        require(Roles.has(distributor, msg.sender), "Not allowed, you're not a distributor");
        _;
    }

    function renounceDistributor() external onlyDistributor {
        Roles.remove(distributor, msg.sender);
        //delete name_d[msg.sender];
        emit _renounceDistributor(msg.sender, "A distributor has renounced");
    }

    function removeDistributor(address _address) public onlyOwner{
        Roles.remove(distributor, _address);
        //delete name_d[_address]; // free up space in mapping
        emit _removeDistributor(_address, "A distributor has been removed");
    }

    function addDistributor(address _address, string memory _name) public onlyOwner{
        Roles.add(distributor, _address);
        name_d[_address]=_name;
        emit _addDistributor(_address, "A distributor has been added by Owner");
    }

    function addDistributor_signup(string memory _name) public{
        Roles.add(distributor, msg.sender);
        name_d[msg.sender]=_name;
        emit _addDistributor(msg.sender, "A farmer has been signed up");
    }

    // Define a function 'isDistributor' to check this role
    function isDistributor(address _address) public view returns (bool) {
        return Roles.has(distributor, _address);
    }

}