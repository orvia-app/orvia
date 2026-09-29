import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createLoader} from './helpers/load-typescript.mjs';

function signupHarness(result) {
 const states=[], redirects=[], notices=[], analytics=[];
 let cursor=0, calls=0;
 const handoff=createLoader()('src/lib/signup-handoff.ts');
 const stubs={
  react:{useState(initial){const i=cursor++; if(!(i in states))states[i]=initial;return [states[i],value=>{states[i]=value;}];},useEffect(){}},
  'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},
  'next/navigation':{useRouter:()=>({replace:path=>redirects.push(path)})},
  '@/components/auth/useAuthSession':{useAuthSession:()=>({isAuthenticated:false,loading:false})},
  '@/components/i18n/I18nProvider':{useI18n:()=>({locale:'ua',t:key=>key})},
  '@/lib/signup-handoff':{getSignupOutcome:handoff.getSignupOutcome,rememberSignupNotice:notice=>notices.push(notice)},
  '@/lib/analytics':{trackBetaEvent:(...args)=>analytics.push(args)},
  '@/lib/supabase/auth':{getSupabaseBrowserAuthClient:()=>({auth:{signUp:async()=>{calls++;return result;}}})},
 };
 const code=ts.transpileModule(readFileSync('src/app/register/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(code,{module,exports:module.exports,require:id=>stubs[id]??new Proxy({},{get:(_,key)=>String(key)})});
 const render=()=>{cursor=0;return module.exports.default();};
 function find(node,predicate){if(!node)return; if(predicate(node))return node;for(const child of [node.props?.children].flat(Infinity)){if(typeof child==='object'){const found=find(child,predicate);if(found)return found;}}}
 render(); states[0]='test@example.com'; states[1]='test-password';
 return {redirects,notices,analytics,states,get calls(){return calls;},async submit(){await find(render(),n=>n.type==='form').props.onSubmit({preventDefault(){}});},render};
}

test('confirmation signup redirects to login, clears password and prevents repeat signup',async()=>{
 const h=signupHarness({data:{session:null,user:{identities:[{}]}},error:null});
 await h.submit();
 assert.deepEqual(h.redirects,['/login']);
 assert.equal(h.notices[0].email,'test@example.com');
 assert.equal(h.notices[0].outcome,'confirmation');
 assert.equal(h.states[1],'');
 await h.submit(); assert.equal(h.calls,1);
 assert.equal(JSON.stringify(h.analytics).includes('test@example.com'),false);
 assert.equal(JSON.stringify(h.analytics).includes('test-password'),false);
});
test('immediate session leaves redirect to existing auth flow and shows no email notice',async()=>{
 const h=signupHarness({data:{session:{access_token:'never-copy'},user:{identities:[{}]}},error:null});
 await h.submit();
 assert.equal(h.notices.length,0); assert.equal(h.redirects.length,0);
 assert.equal(h.states[1],'');
 assert.equal(JSON.stringify(h.analytics).includes('never-copy'),false);
});
test('failed signup remains retryable and does not redirect or claim success',async()=>{
 const h=signupHarness({data:{session:null,user:null},error:{message:'private error'}});
 await h.submit();
 assert.equal(h.notices.length,0);assert.equal(h.redirects.length,0);
 assert.equal(h.states[2],'register.error');
 await h.submit();assert.equal(h.calls,2);
});
