import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {blocks,facades,analyze} from './analysis.js';
export function createViewport(host,{mini=false}={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#edf0f2');
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{host.innerHTML='<div class="webgl-error">3D requires WebGL. Enable hardware acceleration in your browser. Parameters and estimates remain available.</div>';return{update(){},setView(){},dispose(){},toggleCut(){},toggleShadows(){}};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive 3D building. Drag to orbit, scroll to zoom; arrow keys rotate, plus and minus zoom.');renderer.domElement.tabIndex=0;
 const camera=new THREE.PerspectiveCamera(36,1,0.1,1500),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minPolarAngle=0.12;controls.maxPolarAngle=Math.PI/2-0.02;controls.maxDistance=400;controls.minDistance=20;controls.enablePan=!mini;
 scene.add(new THREE.HemisphereLight(0xf8fbff,0x87928a,2.8));const sun=new THREE.DirectionalLight(0xfff6df,3);sun.position.set(-50,95,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-110;sun.shadow.camera.right=110;sun.shadow.camera.top=110;sun.shadow.camera.bottom=-110;sun.shadow.normalBias=0.08;scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),new THREE.MeshStandardMaterial({color:0xedf0f2,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-0.3;ground.receiveShadow=true;scene.add(ground);
 const grid=new THREE.GridHelper(240,48,0xd1d8db,0xe0e5e8);grid.position.y=-0.27;scene.add(grid);
 let group=new THREE.Group();scene.add(group);let current,cut=false,initialized=false;
 const palette={Concrete:0xd5d0c5,'Low-carbon concrete':0xdce0da,'Mass timber':0xbca187};
 function clear(){group.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});scene.remove(group);group=new THREE.Group();scene.add(group);}
 function box(w,h,d,x,y,z,color,options={}){const geo=new THREE.BoxGeometry(Math.max(w,.01),Math.max(h,.01),Math.max(d,.01));const mat=new THREE.MeshStandardMaterial({color,roughness:.75,...options});const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 function update(p){current=p;clear();const bs=blocks(p),total=p.floors*p.height;
  box(p.siteWidth,.18,p.siteDepth,0,-.18,0,0xe1e5df);
  // Site boundary is stationary; building geometry rotates within it.
  const site=group.children[0];
  const border=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(p.siteWidth,.05,p.siteDepth)),new THREE.LineBasicMaterial({color:0xb3bdb7}));border.position.y=-.07;group.add(border);
  const building=new THREE.Group();group.add(building);const addBox=(...args)=>{const m=box(...args);group.remove(m);building.add(m);return m;};
  for(const b of bs){for(let f=0;f<=p.floors;f++){if(cut&&f===p.floors)continue;addBox(b.w+.28,.28,b.d+.28,b.x,f*p.height+.14,b.z,f===p.floors?0xd5d9d2:0xe4e4dc);}
   const coreW=Math.min(5,b.w*.42),coreD=Math.min(6,b.d*.5);addBox(coreW,total,coreD,b.x,total/2,b.z,0xc2c5bb);
   // Structural columns visible through the glazing and in section view.
   for(const sx of [-1,1])for(const sz of [-1,1])addBox(.35,total,.35,b.x+sx*(b.w/2-.7),total/2,b.z+sz*(b.d/2-.7),palette[p.material]);
   if(!cut&&p.pv>0){const innerW=Math.max(1,b.w-1.5),innerD=Math.max(1,b.d-1.5),nx=Math.max(1,Math.floor(innerW/2.1)),nz=Math.max(1,Math.floor(innerD/3.2)),count=Math.round(nx*nz*p.pv/100);for(let i=0;i<count;i++){const ix=i%nx,iz=Math.floor(i/nx);addBox(innerW/nx-.15,.12,innerD/nz-.22,b.x-innerW/2+(ix+.5)*innerW/nx,total+.37,b.z-innerD/2+(iz+.5)*innerD/nz,0x385161,{metalness:.25,roughness:.38});}}
  }
  for(const face of facades(p)){const wwr=p[face.side]/100,span=face.length,bays=Math.max(1,Math.round(span/3.2)),bay=span/bays,windowWidth=bay*.96,winH=p.height*wwr/.96,opaque=(p.height-.28-winH)/2,axis=face.alongX,sign=face.side==='north'||face.side==='west'?-1:1;
   if(cut&&(face.side==='south'||face.side==='east'))continue;
   const facadeBox=(length,height,thick,u,y,v,color,opt)=>axis?addBox(length,height,thick,u,y,v,color,opt):addBox(thick,height,length,v,y,u,color,opt);
   for(let f=0;f<p.floors;f++){const base=f*p.height+.28;for(let i=0;i<bays;i++){const center=face.start+(i+.5)*bay;
     facadeBox(bay,Math.max(.03,opaque),.2,center,base+opaque/2,face.value,palette[p.material]);facadeBox(bay,Math.max(.03,opaque),.2,center,base+opaque+winH+opaque/2,face.value,palette[p.material]);
     facadeBox(windowWidth,winH,.12,center,base+opaque+winH/2,face.value+sign*.03,0x8ca5ac,{metalness:.32,roughness:.23,transparent:true,opacity:.7});
     facadeBox(bay-windowWidth,p.height-.28,.24,face.start+i*bay+(bay-windowWidth)/2,base+(p.height-.28)/2,face.value,palette[p.material]);
     facadeBox(.045,winH,.17,center,base+opaque+winH/2,face.value+sign*.1,0x657a79);
    }
    if(p.shading>.02)facadeBox(span+.3,.11,p.shading, (face.start+face.end)/2,base+opaque+winH+.08,face.value+sign*p.shading/2,0xbfc9bd);
   }
  }
  building.rotation.y=-p.orientation*Math.PI/180;
  // Small landscape markers give a legible site scale without obscuring massing.
  for(const [x,z]of [[-p.siteWidth/2+4,-p.siteDepth/2+4],[p.siteWidth/2-4,-p.siteDepth/2+4],[-p.siteWidth/2+4,p.siteDepth/2-4],[p.siteWidth/2-4,p.siteDepth/2-4]]){box(.25,1.7,.25,x,.85,z,0x9a9a84);const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(1.7,1),new THREE.MeshStandardMaterial({color:0x92aa93,roughness:1}));tree.position.set(x,2.7,z);tree.castShadow=true;group.add(tree);}
  if(!initialized){setView('perspective');initialized=true;}else controls.target.set(0,total*.4,0);
 }
 function setView(view){if(!current)return;const s=Math.max(current.width,current.depth,current.floors*current.height)*2.2;const h=current.floors*current.height*.4;controls.target.set(0,h,0);if(view==='top')camera.position.set(.01,h+s*1.5,.01);else if(view==='front')camera.position.set(0,h,s*1.35);else camera.position.set(s*.95,h+s*.65,s*1.08);camera.lookAt(controls.target);controls.update();}
 const resize=new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();});resize.observe(host);
 let raf;function frame(){raf=requestAnimationFrame(frame);controls.update();renderer.render(scene,camera);}frame();
 renderer.domElement.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){e.preventDefault();const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')spherical.theta-=.1;if(e.key==='ArrowRight')spherical.theta+=.1;if(e.key==='ArrowUp')spherical.phi=Math.max(.12,spherical.phi-.1);if(e.key==='ArrowDown')spherical.phi=Math.min(Math.PI/2-.02,spherical.phi+.1);if(e.key==='+'||e.key==='=')spherical.radius*=.9;if(e.key==='-')spherical.radius*=1.1;camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();}});
 return{update,setView,toggleCut(){cut=!cut;update(current);return cut;},toggleShadows(){renderer.shadowMap.enabled=!renderer.shadowMap.enabled;return renderer.shadowMap.enabled;},dispose(){cancelAnimationFrame(raf);resize.disconnect();controls.dispose();clear();ground.geometry.dispose();ground.material.dispose();renderer.dispose();renderer.domElement.remove();}};
}
