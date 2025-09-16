// ====== Utilidades ======
const fmt = (x, d=2) => Number(x).toFixed(d);
const val = (id) => Number(document.getElementById(id).value);


function propagate(model, xs, sigmas, relStep=1e-6){
  const y0 = model(xs);
  let varSum = 0;
  for (let i=0;i<xs.length;i++){
    const h = (Math.abs(xs[i]) + 1) * relStep;
    const xp = xs.slice(); xp[i] += h;
    const xm = xs.slice(); xm[i] -= h;
    const dydxi = (model(xp) - model(xm)) / (2*h);
    varSum += (dydxi * sigmas[i])**2;
  }
  return {y: y0, sigma: Math.sqrt(varSum)};
}

// ====== Problema 1: Carbono-14 ======
function calcC14(){
  const T  = val('c14_T');
  const dT = val('c14_dT');
  const p  = val('c14_p');
  const dp = val('c14_dp');

  const f  = p/100.0;
  const df = dp/100.0;

  const lnHalf = Math.log(0.5);
  // t = T * ln(f) / ln(1/2)
  const model = ([T_, f_]) => T_ * Math.log(f_) / lnHalf;

  const res = propagate(model, [T, f], [dT, df]);
  const tYears = res.y;
  const sig = res.sigma;
  const rounded = Math.round(tYears);

  document.getElementById('c14_out').textContent =
`Fracción restante f = ${fmt(f,4)} (desde ${p}%).
Edad estimada: t = ${fmt(tYears,2)} años ≈ ${rounded} años.
Incertidumbre (σ): ±${fmt(sig,2)} años.


Parámetros: T=${T}±${dT} años, f=${fmt(f,4)}±${fmt(df,4)}.`;
}

document.getElementById('c14_btn').addEventListener('click', calcC14);
document.getElementById('c14_reset').addEventListener('click', ()=>{
  document.getElementById('c14_T').value = 5730;
  document.getElementById('c14_dT').value = 40;
  document.getElementById('c14_p').value = 77.45;
  document.getElementById('c14_dp').value = 0.10;
  document.getElementById('c14_out').textContent = '';
});

// ====== Problema 2: Ley de Enfriamiento ======
function calcNewton(){
  const Ts  = val('newt_Ts');
  const dTs = val('newt_dTs');
  const T0  = val('newt_T0');
  const dT0 = val('newt_dT0');
  const T1  = val('newt_T1');
  const dT1 = val('newt_dT1');
  const Tv  = val('newt_Tv');
  const dTv = val('newt_dTv');

  // k = -ln((T1 - Ts)/(T0 - Ts))
  const kModel = ([Ts_, T0_, T1_]) => -Math.log((T1_ - Ts_) / (T0_ - Ts_));
  const kRes = propagate(kModel, [Ts, T0, T1], [dTs, dT0, dT1]);
  const k = kRes.y, dk = kRes.sigma;

  // τ = (1/k) ln((Tv - Ts)/(T0 - Ts))
  const tauModel = ([Ts_, T0_, Tv_, k_]) =>
    (1.0 / k_) * Math.log((Tv_ - Ts_) / (T0_ - Ts_));
  const tauRes = propagate(tauModel, [Ts, T0, Tv, k], [dTs, dT0, dTv, dk]);
  const tau = tauRes.y;          // horas
  const dtau = tauRes.sigma;     // horas

  // Conversión a h y min
  const hours = Math.floor(tau);
  const minutes = Math.round((tau - hours)*60);

  // Hora de llegada fija: 21:18 (24h)
  const arrivalMin = 21*60 + 18;
  const deathMin = arrivalMin - Math.round(tau*60);
  let hh = ((Math.floor(deathMin/60) % 24) + 24) % 24;
  let mm = ((deathMin % 60) + 60) % 60;
  const hh12 = ((hh + 11) % 12) + 1;
  const ampm = hh >= 12 ? 'PM' : 'AM';

  document.getElementById('newt_out').textContent =
`Constante de enfriamiento: k = ${fmt(k,5)} ± ${fmt(dk,5)} 1/h.
Tiempo desde la muerte hasta las 9:18 PM: τ = ${fmt(tau,2)} h (≈ ${hours} h ${minutes} min) ± ${fmt(dtau,2)} h.

Hora estimada de muerte: ${hh12.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')} ${ampm}.


σ_y por suma en cuadratura de derivadas parciales (aprox. central).`;
}

document.getElementById('newt_btn').addEventListener('click', calcNewton);
document.getElementById('newt_reset').addEventListener('click', ()=>{
  document.getElementById('newt_Ts').value = 69;
  document.getElementById('newt_dTs').value = 0.5;
  document.getElementById('newt_T0').value = 79.5;
  document.getElementById('newt_dT0').value = 0.2;
  document.getElementById('newt_T1').value = 78.0;
  document.getElementById('newt_dT1').value = 0.2;
  document.getElementById('newt_Tv').value = 98.6;
  document.getElementById('newt_dTv').value = 0.2;
  document.getElementById('newt_out').textContent = '';
});
