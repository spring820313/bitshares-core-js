//import {Apis} from "bitsharesjs-ws";
var WS = require("bitsharesjs-ws");
var {Address, ChainStore, FetchChain, PrivateKey, TransactionHelper, Aes, TransactionBuilder, Signature, hash} = require("../lib")
//import {ChainStore, FetchChain, PrivateKey, TransactionHelper, Aes, TransactionBuilder} from "../lib";
var BigInteger = require('bigi');

var privKey = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3";
let pKey = PrivateKey.fromWif(privKey);
console.log(pKey.toHex())
let pubKey = pKey.toPublicKey()
console.log(pubKey.toString())

var address = Address.fromString('BTS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV');
address = Address.fromPublic(pKey.toPublicKey())
console.log(address.toString())

var r = BigInteger.fromHex('51D65B54D425D519C3F7AF4CE890FA49BC5C55FCA5AF04932CA3B0B6CD27C492');
var s = BigInteger.fromHex('6309E8ACB1DC1D63BDCC5BB6B9A336CAF70C5ECCAF04238C7226124A5FBD4125');
var signature = new Signature(r, s, 0);

var buf = new Buffer('2',  'utf-8')
var _hash = hash.sha256(buf);
var ret = signature.verifyBuffer(buf, pubKey); 

console.log(ret);

WS.Apis.instance("ws://127.0.0.1:8090", true)
.init_promise.then((res) => {
    //console.log("connected to:", res[0].network_name, "network");
    console.log("connected to:", 'testnet', "network");

    ChainStore.init().then(() => {

        let fromAccount = "nathan";
        let memoSender = fromAccount;
        let memo = "Testing transfer from node.js";

        let toAccount = "alpha";

        let sendAmount = {
            amount: 100000,
            asset: "BTS"
        };

        Promise.all([
            FetchChain("getAccount", fromAccount),
            FetchChain("getAccount", toAccount),
            FetchChain("getAccount", memoSender),
            FetchChain("getAsset", sendAmount.asset),
            FetchChain("getAsset", sendAmount.asset),
        ]).then((res)=> {
                // console.log("got data:", res);
            let [fromAccount, toAccount, memoSender, sendAsset, feeAsset] = res;

                // Memos are optional, but if you have one you need to encrypt it here
            let memoFromKey = memoSender.getIn(["options","memo_key"]);
            console.log("memo pub key:", memoFromKey);
            let memoToKey = toAccount.getIn(["options","memo_key"]);
            let nonce = TransactionHelper.unique_nonce_uint64();

            let memo_object = {
                from: memoFromKey,
                to: memoToKey,
                nonce,
                message: Aes.encrypt_with_checksum(
                        pKey,
                        memoToKey,
                        nonce,
                        memo
                    )
            };

            let tr = new TransactionBuilder();

            tr.add_type_operation( "transfer", {
                fee: {
                    amount: 0,
                    asset_id: feeAsset.get("id")
                },
                from: fromAccount.get("id"),
                to: toAccount.get("id"),
                amount: { amount: sendAmount.amount, asset_id: sendAsset.get("id") },
                memo: memo_object
            } );

            tr.set_required_fees().then(() => {
                tr.add_signer(pKey, pKey.toPublicKey().toPublicKeyString());
                console.log("serialized transaction:", tr.serialize());
                tr.broadcast();
            });
        });
    });
});
