
/*jshint esversion: 6 */
import {PrivateKey, key} from "../lib";
//var {PrivateKey, key} = require("bitsharesjs");
//var {PrivateKey, key} = require("../lib");

let seed = "THIS IS A TERRIBLE BRAINKEY SEED WORD SEQUENCE";
let pkey = PrivateKey.fromSeed( key.normalize_brainKey(seed) );

console.log("\nPrivate key:", pkey.toWif());
console.log("Public key :", pkey.toPublicKey().toString(), "\n");
