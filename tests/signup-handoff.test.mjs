import assert from 'node:assert/strict';
import test from 'node:test';
import { createLoader } from './helpers/load-typescript.mjs';

const load = (globals = {}) => createLoader({}, globals)('src/lib/signup-handoff.ts');
test('signup distinguishes confirmation-required, immediate sign-in, and ambiguous responses', () => {
 const {getSignupOutcome} = load();
 assert.equal(getSignupOutcome({session:null,user:{identities:[{}]}}),'confirmation');
 assert.equal(getSignupOutcome({session:{},user:{identities:[{}]}}),'authenticated');
 assert.equal(getSignupOutcome({session:null,user:{identities:[]}}),'check-email');
 assert.equal(getSignupOutcome({session:null,user:{}}),'check-email');
 assert.equal(getSignupOutcome({session:null,user:{identities:[{}],email_confirmed_at:'2026-09-28'}}),'check-email');
 assert.equal(getSignupOutcome({session:null,user:null}),'invalid');
});
test('signup handoff is one-use, trims email, and never retains extra fields', () => {
 const api=load({window:{}});
 api.rememberSignupNotice({email:' test@example.com ',outcome:'confirmation',password:'not-retained',access_token:'not-retained'});
 const notice=api.consumeSignupNotice();
 assert.equal(notice.email,'test@example.com');
 assert.equal(notice.outcome,'confirmation');
 assert.deepEqual(Object.keys(notice).sort(),['email','outcome']);
 assert.equal(api.consumeSignupNotice(),null);
});
test('signup notice expires and does not leak through server rendering', () => {
 let now=1000;
 const api=load({window:{},Date:{now:()=>now}});
 api.rememberSignupNotice({email:'test@example.com',outcome:'confirmation'});
 now+=300001;
 assert.equal(api.consumeSignupNotice(),null);
 const server=load();
 server.rememberSignupNotice({email:'test@example.com',outcome:'confirmation'});
 assert.equal(server.consumeSignupNotice(),null);
});
