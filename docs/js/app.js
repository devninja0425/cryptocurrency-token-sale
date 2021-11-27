App = {
    web3Provider: null,
    contracts: {},
    deployedContracts: {},
    loading: false,
    account: "",
    accountBalance: 0,
    tokenPrice: 0,
    tokensSold: 0,
    tokensAvailable: 750000,

    init: () => {
        console.log("Initialized...");
        return App.initWeb3();
    },

    initWeb3: () => {
        if (typeof ethereum !== "undefined") {
            App.web3Provider = ethereum;
        } else if (typeof web3 !== "undefined") {
            App.web3Provider = web3.currentProvider;
        } else {
            App.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545");
        }
        web3 = new Web3(App.web3Provider);
        App.listenAccountChanges();
        return App.initContracts();
    },

    connectAccount: () => {
        if (typeof ethereum !== "undefined") {
            ethereum.request({method: "eth_requestAccounts"});
        } else if (typeof web3 !== "undefined") {
            try {
                ethereum.enable();
            } catch (e) {
                console.error(e);
            }
        }
    },

    listenAccountChanges: () => {
        if (typeof ethereum !== "undefined") {
            ethereum.on("accountsChanged", (accounts) => {
                App.account = accounts[0];
                App.render();
            });
        }
    },

    initContracts: () => {
        $.getJSON("DappToken.json", async (dappToken) => {
            App.contracts.DappToken = TruffleContract(dappToken);
            App.contracts.DappToken.setProvider(App.web3Provider);
            App.deployedContracts.DappToken = await App.contracts.DappToken.deployed();
            console.log("Dapp Token Address:", App.deployedContracts.DappToken.address);
        }).done(() => {
            $.getJSON("DappTokenSale.json", async (dappTokenSale) => {
                App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
                App.contracts.DappTokenSale.setProvider(App.web3Provider);
                App.deployedContracts.DappTokenSale = await App.contracts.DappTokenSale.deployed();
                console.log("Dapp Token Sale Address:", App.deployedContracts.DappTokenSale.address);
            }).done(async () => {
                App.deployedContracts.DappToken = await App.contracts.DappToken.deployed();
                App.deployedContracts.DappTokenSale = await App.contracts.DappTokenSale.deployed();
                return App.render();
            });
        });
    },

    isLoading: () => {
        let loader = $("#loader");
        let content = $("#content");
        let connectButton = $("#connect-button");
        if (typeof App.account !== "undefined" && App.account !== null) {
            connectButton.hide();
        } else {
            connectButton.show();
        }
        if (App.loading) {
            loader.show();
            content.hide();
        } else {
            loader.hide();
            content.show();
        }
    },

    render: () => {
        App.loading = true;
        App.isLoading();
        web3.eth.getCoinbase(async (error, account) => {
            if (error === null) {
                return await App.successfulRender(account);
            } else {
                return App.failedRender();
            }
        });
    },

    successfulRender: async (account) => {
        if (typeof account !== "undefined" && account !== null) {
            App.account = account;
            $("#accountAddress").text(`Your Account: ${App.account}`);

            App.accountBalance = (await App.deployedContracts.DappToken.balanceOf(App.account)).toNumber();
            App.tokenPrice = (await App.deployedContracts.DappTokenSale.tokenPrice()).toNumber();
            App.tokensSold = (await App.deployedContracts.DappTokenSale.tokensSold()).toNumber();
            // App.tokensAvailable = await App.deployedContracts.DappTokenSale.tokensAvailable();

            let progressPercentage = (App.tokensSold / App.tokensAvailable * 100).toFixed(2);

            $("#dapp-balance").text(App.accountBalance);
            $("#token-price").text(web3.utils.fromWei(new web3.utils.BN(App.tokenPrice), "ether"));
            $("#tokens-sold").text(App.tokensSold);
            $("#tokens-available").text(App.tokensAvailable);
            $("#progress").text(`${progressPercentage}%`);
            $("#progress").css("width", `${progressPercentage}%`);
            $("#progress").attr("aria-valuenow", `${progressPercentage}%`);

            App.loading = false;
            App.isLoading();
        } else {
            return App.failedRender();
        }
    },

    failedRender: () => {
        //
    },

    buyTokens: async () => {
        App.loading = true;
        App.isLoading();
        let numberOfTokens = $("#numberOfTokens").val();
        App.deployedContracts.DappTokenSale.buyTokens(numberOfTokens, {
            from: App.account,
            value: numberOfTokens * App.tokenPrice
        }).then((receipt) => {
            console.log("Tokens bought...\n", receipt);
        }).catch((error) => {
            //
        }).finally(() => {
            $("form").trigger("reset");
            App.loading = false;
            App.render();
        });
    }
};

$(() => {
    $(window).on("load", () => {
        App.init();
    });
});