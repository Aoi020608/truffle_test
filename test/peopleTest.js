const People = artifacts.require("People");
const truffleAssert = require("truffle-assertions");

contract("People", async function(accounts){

	let instance;
	before(async function() {
		instance = await People.deployed();
	});

	it("should not create a person with age over 150 years", async function(){
		//before each
		await truffleAssert.fails(instance.createPerson("Bob", 200, 190, {value: web3.utils.toWei("1", "ether")}));
	});

	it("should not create without payment", async function(){
		await truffleAssert.fails(instance.createPerson("Bob", 200, 190, {value: 1000}));
	}); 

	it("should set senior status correctly", async function(){
		await instance.createPerson("Bob", 65, 190, {value: web3.utils.toWei("1", "ether")});
		let result = await instance.getPerson();
		assert(result.senior === true, "Senior level not set");
	});
	it("should set age correctly", async function() {
		let result = await instance.getPerson();
		assert(result.age.toNumber() === 65, "age not set correctly");
	});
	it("should not allow non-owner to delete people", async function() {
		await instance.createPerson("Lisa", 35, 160, {from: accounts[1], value: web3.utils.toWei("1", "ether")});
		await truffleAssert.fails(instance.deletePerson(accounts[1], {from: accounts[1]}), truffleAssert.ErrorType.REVERT);
	}); 
	it('should allow the owner to delete people', async function() {
		let instance = await People.new(); //create new contract
		await instance.createPerson("Lisa", 35, 160, {from: accounts[1], value: web3.utils.toWei("1", "ether")});
		await truffleAssert.passes(instance.deletePerson(accounts[0], {from: accounts[0]}));
	});
	it('should allow the owner to withdraw', async function() {
		let instance = await People.new();
		await instance.createPerson("Lisa", 35, 160, {from: accounts[2], value: web3.utils.toWei("1", "ether")});
		await truffleAssert.passes(instance.withdrawAll({from: accounts[0]}));
	}); 
	it('owners balance should increase after withdrawal', async function() {
		let instance = await People.new();
		await instance.createPerson("Lisa", 35, 160, {from: accounts[0], value: web3.utils.toWei("1", "ether")});

		let balanceBefore = parseFloat(await web3.eth.getBalance(accounts[0]));
		await instance.withdrawAll();
		let balanceAfter = parseFloat(await web3.eth.getBalance(accounts[0]));
		assert(balanceBefore < balanceAfter, "owners balance was not increased after withdrawal");
	});
	it("should reset balance to 0 after withdrawal", async function() {
		let instance = await People.new();
		await instance.createPerson("Lisa", 35, 160, {from: accounts[0], value: web3.utils.toWei("1", "ether")});

		await instance.withdrawAll();

		let balance = await instance.balance();
		let floatBalance = parseFloat(balance);

		let realBalance = await web3.eth.getBalance(instance.address);

		assert(floatBalance == web3.utils.toWei("0", "ether") && floatBalance == realBalance, "balance should be 1 ether and should be same price with blockchains");
	})
});
