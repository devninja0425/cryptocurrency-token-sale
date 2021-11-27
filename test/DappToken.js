const DappToken = artifacts.require("DappToken");
const Revert = require("./helpers/Revert");
contract(DappToken.contractName, (accounts) => {
    before(async () => {
        this.token = await DappToken.deployed();
        this.name = "DApp Token";
        this.symbol = "DAPP";
        this.totalSupply = 1000000;
        this.standard = "DApp Token v1.0";
    });

    describe("Init", () => {
        it("Contract has been deployed successfully", async () => {
            let address = await this.token.address;
            assert.notEqual(address, 0x0);
        });
        it("Has the correct name", async () => {
            let name = await this.token.name();
            assert.equal(name, this.name);
        });
        it("Has the correct symbol", async () => {
            let symbol = await this.token.symbol();
            assert.equal(symbol, this.symbol);
        });
        it("Has the correct total supply", async () => {
            let totalSupply = await this.token.totalSupply();
            assert.equal(totalSupply.toNumber(), this.totalSupply);
        });
        it("Has the correct standard", async () => {
            let standard = await this.token.standard();
            assert.equal(standard, this.standard);
        });
        it("Owner own all of total supply at the first time", async () => {
            let balanceOf = await this.token.balanceOf(accounts[0]);
            assert.equal(balanceOf.toNumber(), this.totalSupply);
        });
    });

    describe("Token Transfers", () => {
        before(() => {
            this.amountToTransfer = this.totalSupply * 25 / 100;
        });
        it("Can't transfer not enough token", async () => {
            await Revert(async () => {
                await this.token.transfer(accounts[1], this.totalSupply + 1, {
                    from: accounts[0]
                });
            });
        });
        describe("Should token transfers successful", () => {
            before(() => {
                this.receipt = null;
            });
            it("Transfer", async () => {
                this.receipt = await this.token.transfer(accounts[1], this.amountToTransfer, {
                    from: accounts[0]
                });
                let balance = await this.token.balanceOf(accounts[1]);
                assert.equal(balance.toNumber(), this.amountToTransfer);
            });
            describe("Event check", () => {
                it("Triggers one event", async () => {
                    assert.equal(this.receipt.logs.length, 1);
                });
                it("Should be the `Transfer` event", async () => {
                    assert.equal(this.receipt.logs[0].event, "Transfer");
                });
                it("Has the correct `from` argument", async () => {
                    assert.equal(this.receipt.logs[0].args._from, accounts[0]);
                });
                it("Has the correct `to` argument", async () => {
                    assert.equal(this.receipt.logs[0].args._to, accounts[1]);
                });
                it("Has the correct `value` argument", async () => {
                    assert.equal(this.receipt.logs[0].args._value, this.amountToTransfer);
                });
            });
        });
        describe("Should previous sender's amount decreased", () => {
            it("Has the correct amount", async () => {
                let balance = await this.token.balanceOf(accounts[0]);
                assert.equal(balance.toNumber(), this.totalSupply - this.amountToTransfer);
            });
        });
        describe("Delegated Transfer", () => {
            before(() => {
                this.amountToApprove = this.totalSupply * 5 / 100;
                this.fromAccount = accounts[1];
                this.spendingAccount = accounts[2];
                this.toAccount = accounts[3];
                this.receipt = null;
            });
            it("Approves tokens for delegated transfer", async () => {
                this.receipt = await this.token.approve(this.spendingAccount, this.amountToApprove, {
                    from: this.fromAccount
                });
                let allowance = await this.token.allowance(this.fromAccount, this.spendingAccount);
                assert.equal(allowance.toNumber(), this.amountToApprove);
            });
            describe("Event check", () => {
                it("Triggers one event", async () => {
                    assert.equal(this.receipt.logs.length, 1);
                });
                it("Should be the `Approval` event", async () => {
                    assert.equal(this.receipt.logs[0].event, "Approval");
                });
                it("Has the correct `owner` argument", async () => {
                    assert.equal(this.receipt.logs[0].args._owner, this.fromAccount);
                });
                it("Has the correct `spender` argument", async () => {
                    assert.equal(this.receipt.logs[0].args._spender, this.spendingAccount);
                });
                it("Has the correct `value` argument", async () => {
                    assert.equal(this.receipt.logs[0].args._value, this.amountToApprove);
                });
            });
            describe("Handles delegated token transfers", () => {
                before(() => {
                    this.receipt = null;
                });
                it("Can't transfer token larger than the sender's balance", async () => {
                    await Revert(async () => {
                        await this.token.transferFrom(this.fromAccount, this.toAccount, this.amountToTransfer + 1, {
                            from: this.spendingAccount
                        });
                    });
                });
                it("Can't transfer token larger than the spending's account approved", async () => {
                    await Revert(async () => {
                        await this.token.transferFrom(this.fromAccount, this.toAccount, this.amountToApprove + 1, {
                            from: this.spendingAccount
                        });
                    });
                });
                it("Should spending's account token transfer successful", async () => {
                    this.receipt = await this.token.transferFrom(this.fromAccount, this.toAccount, this.amountToApprove, {
                        from: this.spendingAccount
                    });
                    let balance = await this.token.balanceOf(this.toAccount);
                    assert.equal(balance.toNumber(), this.amountToApprove);
                });
                describe("Event check", () => {
                    it("Triggers one event", async () => {
                        assert.equal(this.receipt.logs.length, 1);
                    });
                    it("Should be the `Transfer` event", async () => {
                        assert.equal(this.receipt.logs[0].event, "Transfer");
                    });
                    it("Has the correct `from` argument", async () => {
                        assert.equal(this.receipt.logs[0].args._from, this.fromAccount);
                    });
                    it("Has the correct `to` argument", async () => {
                        assert.equal(this.receipt.logs[0].args._to, this.toAccount);
                    });
                    it("Has the correct `value` argument", async () => {
                        assert.equal(this.receipt.logs[0].args._value, this.amountToApprove);
                    });
                });
                describe("Should sender's amount decreased", () => {
                    it("Has the correct amount", async () => {
                        let balance = await this.token.balanceOf(this.fromAccount);
                        assert.equal(balance.toNumber(), this.amountToTransfer - this.amountToApprove);
                    });
                });
                describe("Should spending's amount from allowance decreased", () => {
                    it("Has the correct allowance's amount", async () => {
                        let allowance = await this.token.allowance(this.fromAccount, this.spendingAccount);
                        assert.equal(allowance.toNumber(), this.amountToApprove - this.amountToApprove);
                    });
                });
            });
        });
    });
});