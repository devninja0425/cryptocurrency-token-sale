const DappToken = artifacts.require("DappToken");
const DappTokenSale = artifacts.require("DappTokenSale");

module.exports = (deployer) => {
    deployer.deploy(DappTokenSale, DappToken.address, web3.utils.toWei("0.001", "ether"));
};