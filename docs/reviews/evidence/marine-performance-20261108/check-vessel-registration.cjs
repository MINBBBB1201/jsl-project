// Pure geometry/shader-uniform check. This does not start or render the application.
const fs=require('fs'),crypto=require('crypto');
const THREE=require(process.env.JSL_THREE_MODULE || 'three');
const sourcePath=require('path').join(process.env.JSL_PROTOTYPE_ROOT, 'prototypes/multimodal-marine-native/marine-photo-vessel.js');
const source=fs.readFileSync(sourcePath,'utf8');
const output=[];
function assert(condition,message){if(!condition)throw new Error(message);}
let pendingLoad;
global.document={getElementById(){return null;}};
const TestTHREE={...THREE,TextureLoader:class {load(url,onLoad){const texture=new THREE.Texture();pendingLoad=()=>onLoad(texture);return texture;}}};
const init=new Function(`${source}; return initMarinePhotoVessel;`)();
for(const transformed of [false,true]){
 const parent=new THREE.Group(),group=new THREE.Group(),cargo=new THREE.Group();parent.add(group);group.add(cargo);
 if(transformed){parent.position.set(-30,14,5);parent.rotation.set(.2,-.3,.1);group.position.set(4,-2,9);group.rotation.set(-.1,.4,.12);group.scale.set(1.2,.8,.9);}
 const C={length:12.19,beam:2.44,height:2.59,deck:4.2,pitchX:12.44};
 const geometry=new THREE.PlaneGeometry(C.length,C.beam);geometry.rotateX(-Math.PI/2);
 const uv=geometry.getAttribute('uv');for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,1-u,1-v);}
 cargo.position.set(-28+3*C.pitchX,C.deck+.14+C.height*3+.047,0);
 const roof=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());cargo.add(roof);cargo.userData.roofMesh=roof;cargo.userData.roofTexture=new THREE.Texture();
 const result=init(TestTHREE,{group,cargo},'fixture-only');
 const r=result.status.registration;
 assert(r.state==='registered','registration unavailable');assert(r.areaScale>0,'vessel reflected');assert(r.fourthCornerError<.1,'fourth corner exceeds10cm');
 assert(r.xScale>.8&&r.xScale<1.25&&r.zScale>.8&&r.zScale<1.25,'excessive silhouette deformation');
 const photo=group.children.find(n=>n.name==='JSL / photo vessel'),shadow=group.children.find(n=>n.name==='JSL / photo vessel shadow');
 const p=photo.geometry.getAttribute('position'),s=shadow.geometry.getAttribute('position');
 for(let i=0;i<p.count;i++){assert(Math.abs(p.getX(i)-s.getX(i))<1e-8&&Math.abs(p.getZ(i)-s.getZ(i))<1e-8,'shadow detached in XZ');assert(Math.abs(p.getY(i)-s.getY(i)-.06)<1e-5,'contact shadow height');}
 assert(shadow.material.opacity===.12,'shadow opacity changed');
 assert(photo.geometry.boundingBox&&photo.geometry.boundingSphere&&photo.geometry.getAttribute('normal'),'geometry bounds/normals missing');
 const shader={uniforms:{},fragmentShader:'#include <common>\n#include <map_fragment>'};photo.material.onBeforeCompile(shader);
 const matrix=shader.uniforms.jslPhotoToRoof.value,quad=[[959,337],[1116,289],[1123,321],[967,369]],ids=[0,1,3,2];
 const paintErrors=quad.map(([px,py],i)=>{const q=new THREE.Vector3(px/1962,1-py/838,1).applyMatrix3(matrix);return Math.hypot(q.x/q.z-uv.getX(ids[i]),q.y/q.z-uv.getY(ids[i]));});
 assert(Math.max(...paintErrors)<1e-10,'paint axes flipped relative to native roof');
 const handoff=[];
 result.update(.65);assert(roof.visible&&!photo.visible,'missing photograph must preserve native source');
 pendingLoad();
 for(const progress of [.52,.57499,.575,.58,.65,.58,.575,.57499,.52]){
  result.update(progress);const isPhoto=progress>=.575;
  assert(photo.visible===isPhoto&&shadow.visible===isPhoto&&roof.visible===!isPhoto,'source handoff must be exclusive');
  assert(photo.material.opacity===(isPhoto?1:0),'photograph must not crossfade');
  handoff.push({progress,source:result.status.renderSource,photoOpacity:photo.material.opacity,nativeVisible:roof.visible});
 }
 output.push({transformedParentAndGroup:transformed,registration:r,paintErrors,shadow:{maximumOpacity:.12,heightDifference:.06,xzOffset:0},handoff,nativeRoofY:cargo.position.y,photoPlaneY:p.getY(0)});
 result.dispose();roof.geometry.dispose();roof.material.dispose();cargo.userData.roofTexture.dispose();
}
const report={scope:'Pure Three.js geometry test with native roof dimensions/UV fixture; no browser or visual approval',sourceSha256LF:crypto.createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex'),results:output};
fs.writeFileSync(`${__dirname}/vessel-registration-math.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
