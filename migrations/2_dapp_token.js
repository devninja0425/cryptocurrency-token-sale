const DappToken = artifacts.require("DappToken");

module.exports = (deployer) => {
    const name = "DApp Token";
    const symbol = "DAPP";
    const totalSupply = 1000000;
    const standard = "DApp Token v1.0";
    deployer.deploy(DappToken, name, symbol, totalSupply, standard);
};