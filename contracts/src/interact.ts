import { AccountUpdate, Mina, PrivateKey } from 'o1js';
import { MinaChallenge2 } from './index';

const doProofs = true;

let Local = Mina.LocalBlockchain({ proofsEnabled: doProofs });
Mina.setActiveInstance(Local);

// a test account that pays all the fees, and puts additional funds into the zkapp
let feePayerKey = Local.testAccounts[0].privateKey;
let feePayer = Local.testAccounts[0].publicKey;

// the zkapp account
let zkappKey = PrivateKey.fromBase58(
  'EKEQc95PPQZnMY9d9p1vq1MWLeDJKtvKj4V75UDG3rjnf32BerWD'
);
let zkappAddress = zkappKey.toPublicKey();
let zkapp = new MinaChallenge2(zkappAddress);
if (doProofs) {
  console.log('compile');
  await MinaChallenge2.compile();
} else {
  // TODO: if we don't do this, then `analyzeMethods()` will be called during `runUnchecked()` in the tx callback below,
  // which currently fails due to `finalize_is_running` in snarky not resetting internal state, and instead setting is_running unconditionally to false,
  // so we can't nest different snarky circuit runners
  MinaChallenge2.analyzeMethods();
}

console.log('deploy');

let tx = await Mina.transaction(feePayer, () => {
  AccountUpdate.fundNewAccount(feePayer);
  zkapp.deploy();
});
await tx.prove();
await tx.sign([feePayerKey, zkappKey]).send();

console.log('deployed');
