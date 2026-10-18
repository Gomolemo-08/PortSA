import { useEffect, useMemo, useState } from 'react';
import { QUESTIONS } from './data.js';

const TIME = 20;
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
const rank = (s) => s >= 1500 ? ['Executive Mayor', '🏛️'] : s >= 1000 ? ['Ward Councillor', '🗳️'] : s >= 500 ? ['Ward Committee Member', '📋'] : ['Active Citizen', '🌱'];

export default function Game() {
  const [qs, setQs] = useState(() => shuffle(QUESTIONS));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState(null);
  const [t, setT] = useState(TIME);
  const [best, setBest] = useState(() => { try { return +localStorage.getItem('fm-best') || 0; } catch { return 0; } });
  const done = i >= qs.length;
  const q = qs[i];

  useEffect(() => {
    if (done || picked !== null) return;
    if (t <= 0) { setPicked(-1); setStreak(0); return; }
    const id = setTimeout(() => setT((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [t, picked, done]);

  useEffect(() => {
    if (!done) return;
    setBest((b) => { const nb = Math.max(b, score); try { localStorage.setItem('fm-best', nb); } catch {} return nb; });
  }, [done]); // eslint-disable-line

  const answer = (n) => {
    if (picked !== null) return;
    setPicked(n);
    if (n === q.c) { const s = streak + 1; setStreak(s); setScore((x) => x + 100 + t * 5 + Math.min(s - 1, 4) * 20); }
    else setStreak(0);
  };
  const next = () => { setI((x) => x + 1); setPicked(null); setT(TIME); };
  const restart = () => { setQs(shuffle(QUESTIONS)); setI(0); setScore(0); setStreak(0); setPicked(null); setT(TIME); };
  const [title, icon] = useMemo(() => rank(score), [score]);

  return (
    <section className="game">
      <div className="game-card">
        <div className="game-top">
          <h2>🏛️ Council Chamber</h2>
          <div className="chips"><span>Score <b>{score}</b></span><span>Streak <b>🔥{streak}</b></span><span>Best <b>{best}</b></span></div>
        </div>
        {!done ? (
          <>
            <div className="bar"><i style={{ width: `${((i + (picked !== null ? 1 : 0)) / qs.length) * 100}%` }} /></div>
            <p className="muted">Question {i + 1} of {qs.length} · <span className={t <= 5 ? 'danger' : ''}>⏱ {t}s</span></p>
            <h3 className="q">{q.q}</h3>
            <div className="answers">
              {q.a.map((opt, n) => (
                <button key={n} disabled={picked !== null} onClick={() => answer(n)}
                  className={picked === null ? '' : n === q.c ? 'right' : n === picked ? 'wrong' : 'dim'}>{opt}</button>
              ))}
            </div>
            {picked !== null && (
              <div className="explain" role="status">
                <strong>{picked === q.c ? '✅ Correct!' : picked === -1 ? '⏰ Time’s up!' : '❌ Not quite.'}</strong> {q.e}
                <button className="primary" onClick={next}>{i + 1 === qs.length ? 'See results' : 'Next question →'}</button>
              </div>
            )}
          </>
        ) : (
          <div className="result">
            <div className="big">{icon}</div>
            <h3>You are a {title}!</h3>
            <p className="muted">Final score <b>{score}</b>{score >= best && score > 0 ? ' · New personal best!' : ''}</p>
            <p>Local government fixes the potholes, water and lights in your street, and your vote and your reports shape it. Register to vote and report faults in your ward.</p>
            <button className="primary" onClick={restart}>Play again</button>
          </div>
        )}
      </div>
    </section>
  );
}
