import type {APIRoute} from 'astro';
export function getStaticPaths(){return ['stack','tree','code','blocks'].map(kind=>({params:{kind}}))}
export const GET:APIRoute=({params})=>{
const kind=params.kind??'stack';
const tau=Math.PI*2;
const wireColors:Record<string,string>={stack:'#d3bdff',tree:'#8fe4bc',code:'#98c9ff',blocks:'#efafe6'};
const wire=wireColors[kind]??wireColors.stack;
function point(u:number,v:number) {
  const radius=kind==='tree'?50+19*Math.cos(v)*Math.cos(3*u):57+23*Math.cos(v);
  const x=radius*Math.cos(u), y=radius*Math.sin(u);
  const z=23*Math.sin(v)+(kind==='blocks'?16*Math.sin(3*u):kind==='code'?18*Math.cos(2*u):0);
  const h=y*.47-z*.88;
  return {x:110+x*.91+h*.41,y:80-x*.41+h*.91,depth:y*.88+z*.47};
}
const grid=[];
for(let i=0;i<64;i++){
  for(let j=0;j<24;j++){
    const u=tau*i/64,v=tau*j/24;
    const corners=[point(u,v),point(u+tau/64,v),point(u+tau/64,v+tau/24),point(u,v+tau/24)];
    const depth=corners.reduce((n,p)=>n+p.depth,0)/4;
    grid.push({depth,path:corners.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' '),shade:Math.round(20+45*(1+Math.cos(v-.8))/2+20*(1+Math.sin(u))/2)});
  }
}
grid.sort((a,b)=>a.depth-b.depth);
const mesh=grid.map(cell=>`<polygon points="${cell.path}" fill="rgb(${Math.round(cell.shade*.57)} ${Math.round(cell.shade*.51)} ${Math.round(cell.shade*.85)})"/>`).join('');
return new Response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 160"><g fill="none" stroke="${wire}" opacity=".28" stroke-width=".45"><ellipse cx="109" cy="84" rx="108" ry="46" transform="rotate(-25 109 84)"/><ellipse cx="109" cy="84" rx="109" ry="47" transform="rotate(-25 109 84)" stroke-dasharray="1 4"/></g><g stroke="${wire}" stroke-width=".5" stroke-linejoin="round">${mesh}</g></svg>`,{headers:{'Content-Type':'image/svg+xml'}});
};
