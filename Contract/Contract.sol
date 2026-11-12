// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract Main 
{
    uint public money = 0; // Stores the 10% commission
    address public owner;

    struct Courses 
    {
        string courseID;
        address educatorAddress; // Use educator's address instead of edID
        uint256 courseFee; // Fee required to purchase the course
    }

    struct Educator 
    {
        address payable addr;
    }

    mapping(address => Educator) public educators;

    // Events
    event CourseAdded(address indexed educator, string courseID, uint256 fee);
    event CoursePurchased(bytes32 transactionId);
    event Redeemed(address indexed student, uint256 ethAmount);

    constructor() 
    {
        owner = payable(msg.sender); // Set the contract deployer as the owner
    }

    // Add a new course
    function addCourse() public payable returns (bool) 
    {
        require(msg.value == 0.01 ether, "Incorrect Ether amount sent.");
        
        Educator storage educator = educators[msg.sender];
        educator.addr = payable(msg.sender); // Assign the educator's address

        uint ownerShare = (msg.value * 9) / 10;
        uint contractShare = msg.value - ownerShare; // Avoid extra division

        (bool success, ) = payable(owner).call{value: ownerShare, gas: 5000}(""); // Provide limited gas
        if (!success) 
        {
            return false; // If transfer fails, return false
        }

        money += contractShare;

        return true;
    }


    // Redeem coins for ETH
    uint public constant CONVERSION_RATE = 0.01 ether / 10; // 10 coins = 0.01 ETH

    function redeem(uint _coins, address payable _studentAddress) public returns (bool) 
    {
        uint ethAmount = (_coins * CONVERSION_RATE);
        bool success = false;

        if (money < ethAmount) 
        {
            emit Redeemed(_studentAddress, 0); // Log failure
            return false; // Not enough funds
        }
        if (_studentAddress == address(0)) 
        {
            emit Redeemed(_studentAddress, 0);
            return false; // Invalid address
        }

        // Deduct coins first (temporarily)
        money -= ethAmount;

        _studentAddress.transfer(ethAmount);
        success = true;

        if (!success) 
        {
            money += ethAmount; // 🔥 Rollback the deduction if transfer fails!
            emit Redeemed(_studentAddress, 0);
            return false; // Return failure instead of reverting
        }

        emit Redeemed(_studentAddress, ethAmount);
        return success; // Return success
    }


    // Buy a course
    function buyCourse(uint _courseFee, address payable educator) public payable returns (bool) 
    {
        require(msg.value == _courseFee, "Incorrect Ether amount sent.");
        // require(educator != address(0), "Invalid educator address."); // 🔥 Ensure valid educator address

        bytes32 transactionId = keccak256(abi.encodePacked(msg.sender, educator, _courseFee, block.timestamp, block.number));

        uint educatorShare = (msg.value * 9) / 10;
        uint contractShare = msg.value / 10;

        (bool success, ) = educator.call{value: educatorShare}("");

        if (!success) 
        {
            emit CoursePurchased(transactionId); // Log attempt
            return false; // Indicate failure
        }

        money += contractShare;

        emit CoursePurchased(transactionId);
        return true; // Indicate success
    }



    // Fallback function to accept ETH
    receive() external payable {}
}