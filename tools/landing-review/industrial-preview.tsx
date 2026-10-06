import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from '../../frontend/node_modules/gsap';
import { IndustrialScenes } from '../../frontend/src/app/landing/components/industrial-scenes';
import { industrialFrame, modeProgress, stageProgress } from '../../frontend/src/app/landing/components/industrial-motion';
import english from '../../frontend/src/messages/en.json';

const modes = Object.entries(english.services.modes).map(([code, item]) => ({ code, ...item, href: `/services/${code.toLowerCase()}` }));
function Preview() {
  const [p, setP] = useState(0.015);
  const frame = industrialFrame(p, window.innerWidth < 768);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.industrial-journey')!;
    root.dataset.progress = p.toFixed(4);
    gsap.set('.industrial-vehicle', { left: `${frame.truckX}%`, width: `${frame.truckWidth}%`, bottom: `${frame.truckBottom}%`, filter: `brightness(${frame.night})` });
    gsap.set('.industrial-port', { scale: frame.portScale, xPercent: frame.portX });
    gsap.set('.industrial-warehouse', { scale: frame.warehouseScale, clipPath: `inset(0 ${100 * (1-frame.warehouse)}% 0 0)` });
    gsap.set('.industrial-transport-ui', { autoAlpha: frame.transportOpacity });
    gsap.set('.industrial-journey-ui', { autoAlpha: frame.journeyOpacity });
    gsap.set('.industrial-step-line span', { scaleX: (frame.stage + 1)/7 });
    (root.querySelector('.industrial-transport-ui') as HTMLElement).inert = frame.transportOpacity < .5;
    (root.querySelector('.industrial-journey-ui') as HTMLElement).inert = frame.journeyOpacity < .5;
  }, [p, frame.truckX, frame.truckWidth, frame.truckBottom, frame.night, frame.portScale, frame.portX, frame.warehouseScale, frame.warehouse, frame.transportOpacity, frame.journeyOpacity, frame.stage]);
  useEffect(() => {
    const api = { setProgress: setP, play: () => {
      const driver = { p: 0 };
      return gsap.to(driver, { p: 1, duration: 18, ease: 'none', onUpdate: () => setP(driver.p) });
    } };
    Object.assign(window, { __industrialPreview: api });
  }, []);
  return <>
    <section className="journey industrial-journey"><div className="industrial-stage">
      <IndustrialScenes services={modes} title={english.services.title} description={english.services.description} mode={frame.mode} stage={frame.stage}
        onMode={index => setP(modeProgress(index))} onStage={index => setP(stageProgress(index))} onSkip={() => setP(1)}
        renderLink={(href, children, className) => <a href={href} className={className}>{children}</a>} />
    </div></section>
    <div id="preview-controls"><label>Motion sample (2.5D) <input type="range" min="0" max="1" step="0.001" value={p} onChange={event => setP(Number(event.target.value))}/></label><button onClick={() => (window as unknown as { __industrialPreview: {play:()=>void} }).__industrialPreview.play()}>Play 18s</button></div>
  </>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
