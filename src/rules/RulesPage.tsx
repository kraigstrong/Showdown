// How we play: the 2000 and 2001 rulebooks' rules, with every house rule marked.
// Numbers come from the game's own code, so the page can't drift from the game.
import type { ReactNode } from 'react';
import { BENCH_ALLOWED_FROM_INNING, HOME_THROW_TARGET, STARTER_RUN_LIMIT, STARTER_SAFE_THROUGH_INNING } from '../engine';
import { BENCH_COST_DIVISOR, MAX_ROSTER, POINT_CAP } from '../teams/limits';
import { Wordmark } from '../ui/Wordmark';

const GAME_URL = import.meta.env.BASE_URL;
const BOOK_2000 = 'https://web.archive.org/web/20000816004444/http://www.wizards.com:80/showdown/rules.asp';
const BOOK_2001 = 'https://web.archive.org/web/20010503141027/http://www.wizards.com:80/showdown/mlb/main.asp?x=mlb/rulebook,3';

const SECTIONS = [
  { id: 'basics', title: 'The basics' },
  { id: 'setup', title: 'Setting up a game' },
  { id: 'at-bat', title: 'The at-bat' },
  { id: 'ground-balls', title: 'Ground balls and double plays' },
  { id: 'extra-bases', title: 'Extra bases and tagging up' },
  { id: 'steals', title: 'Stolen bases' },
  { id: 'pitchers', title: 'Pitchers' },
  { id: 'bench', title: 'Pinch hitters' },
  { id: 'positions', title: 'Positions' },
  { id: 'teams', title: 'Building a team' },
  { id: 'cards', title: 'The cards' },
  { id: 'winning', title: 'Winning' },
  { id: 'sources', title: 'Sources' },
];

/** A rule we play differently from the 2000 and 2001 rulebooks, and what the book says. */
function House({ title, children, book }: { title: string; children: ReactNode; book: ReactNode }) {
  return (
    <aside className="house">
      <p className="house__tag">House rule</p>
      <h3 className="house__title">{title}</h3>
      <div className="house__body">{children}</div>
      <p className="house__book">
        <strong>The book:</strong> {book}
      </p>
    </aside>
  );
}

function Section({ id, children }: { id: string; children: ReactNode }) {
  const title = SECTIONS.find((section) => section.id === id)?.title;
  return (
    <section className="rules__section" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}

export function RulesPage() {
  const homeTargets = Object.entries(HOME_THROW_TARGET)
    .map(([letter, target]) => `${letter} ${target}`)
    .join(', ');
  return (
    <div className="rules">
      <header className="rules__head">
        <a className="rules__back" href={GAME_URL}>
          ← Back to the game
        </a>
        <Wordmark large />
        <p className="setup__band">Rulebook</p>
        <p className="rules__lede">
          How we play: the 2000 and 2001 rules, plus our house rules. Everything in a red box is a house rule, with what
          the book says instead.
        </p>
      </header>

      <nav className="rules__toc" aria-label="Contents">
        <ol>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      <main>
        <Section id="basics">
          <p>
            Two managers, one 20-sided die, and a team of player cards each. Every hitter card has an On-Base number, a
            Speed, the positions he can play with his Fielding there, and a chart from 1 to 20. Every pitcher card has a
            Control number, an IP (innings pitched), and his own chart.
          </p>
          <p>Speed comes as a letter: A is 20, B is 15 and C is 10 whenever a roll has to beat it.</p>
          <p>
            We play the book's advanced game plus its expert rules for extra bases and double plays. We don't use the
            other expert rules: intentional walks, bunts, pinch runners, defensive replacements, or losing IP for runs
            allowed.
          </p>
          <House
            title="No strategy cards and no icons"
            book="the advanced game is built around a hand of strategy cards, and later sets add player icons. Steals and Fielding checks only happen through strategy cards."
          >
            <p>We play without strategy cards and ignore icons. Steals have their own rule instead (see Stolen bases).</p>
          </House>
        </Section>

        <Section id="setup">
          <p>The visitors bat first. Each manager sets a batting order of nine: eight fielders and a designated hitter.</p>
          <House
            title="Pick your starting pitcher"
            book="the home team rolls the die: 1–5 both teams' first starters pitch, 6–10 the second, 11–15 the third, 16–20 the fourth."
          >
            <p>Each manager chooses which of his starters pitches the game.</p>
          </House>
          <House
            title="Always a designated hitter"
            book="both teams use a DH only under American League rules, when the home team is an AL team. Under NL rules the pitcher bats."
          >
            <p>Both teams always bat a DH, and pitchers never bat.</p>
          </House>
          <House
            title="Platoons (saved teams)"
            book="no platoons. Your lineup is set before the game."
          >
            <p>
              A saved team can share one lineup spot between two players. Whoever bats from the other side of the
              opposing starter plays (a lefty against a right-hander, a righty against a lefty), and the other starts on
              the bench.
            </p>
          </House>
        </Section>

        <Section id="at-bat">
          <ol className="rules__steps">
            <li>
              <strong>The pitch.</strong> The pitcher rolls the die and adds his Control, minus any fatigue. If his total
              is <em>higher</em> than the batter's On-Base, the pitcher has the advantage. Otherwise, ties included, the
              batter does.
            </li>
            <li>
              <strong>The swing.</strong> The batter rolls and reads the result off the chart of whoever has the
              advantage.
            </li>
          </ol>
          <dl className="rules__results">
            <dt>Out (SO), Out (PU)</dt>
            <dd>The batter is out. Runners stay put.</dd>
            <dt>Out (GB)</dt>
            <dd>The batter is out, and it may be a double play (see Ground balls).</dd>
            <dt>Out (FB)</dt>
            <dd>The batter is out. Runners may tag up (see Extra bases).</dd>
            <dt>Walk</dt>
            <dd>The batter takes first. Runners move up only if they're forced.</dd>
            <dt>Single</dt>
            <dd>Every runner moves up 1 base.</dd>
            <dt>Single+</dt>
            <dd>A single, and if second is open afterward, the batter takes it without a throw.</dd>
            <dt>Double</dt>
            <dd>Every runner moves up 2 bases.</dd>
            <dt>Triple, Homer</dt>
            <dd>Every runner scores. The batter takes third, or scores.</dd>
          </dl>
          <p>Runners never advance on a swing that makes the third out.</p>
        </Section>

        <Section id="ground-balls">
          <p>
            With first base empty, a ground ball is just an out, and runners on second and third move up a base (the
            runner on third scores).
          </p>
          <p>
            With a runner on first, he's out, and the defense tries to turn two: roll the die and add the four infielders'
            Fielding. If the total <em>beats</em> the batter's Speed, he's out too. Otherwise he's safe at first. Either
            way, runners on second and third move up, unless that was the third out.
          </p>
        </Section>

        <Section id="extra-bases">
          <p>
            After a single or double, a runner who stopped at second or third may try for one more base. On a fly ball
            that isn't the third out, a runner on second or third may tag up and try for the next base. The batter
            himself never tries for an extra base.
          </p>
          <p>
            If you send more than one runner, the defense picks one to throw at, and the others make it. A run scored by
            the lead runner counts even if the trail runner is thrown out for the third out. Ties always go to the
            runner.
          </p>
          <p>
            <strong>To second or third:</strong> the defense rolls and adds all three outfielders' Fielding. If the
            total beats the runner's Speed, he's out.
          </p>
          <House title="No bonus for two outs" book="add +5 to the runner's target if there were 2 outs before the swing.">
            <p>The number of outs doesn't change the throw.</p>
          </House>
          <House
            title="Throws home"
            book="the whole outfield's Fielding against the runner's Speed + 5 (+5 more with 2 outs). The 2000 book had no throw at all: a runner on second always scores on a single."
          >
            <p>When a runner heads home, on a hit or tagging up from third, one outfielder makes the throw:</p>
            <ol className="rules__steps">
              <li>
                The defense rolls for who throws. Against a left-handed batter, 1–10 is the right fielder and 11–20 the
                center fielder. Against a right-handed batter, 1–10 is the left fielder and 11–20 center. A switch hitter
                bats from the other side of the pitcher.
              </li>
              <li>
                That outfielder rolls and adds his own arm (his Fielding). He has to beat {homeTargets} for a runner with
                Speed A, B or C.
              </li>
            </ol>
          </House>
        </Section>

        <Section id="steals">
          <House title="Steal any time, without a card" book="you can only try to steal with a strategy card that allows it.">
            <p>
              Before the pitch, the offense may send a runner from first to second or from second to third, if the base
              ahead is open, or both at once (the defense picks which runner to throw at). You can't steal home.
            </p>
            <p>
              The catcher rolls and adds his Arm, plus 5 if the runner is stealing third. If the total beats the runner's
              Speed, he's out. Otherwise he's safe. This part is the book's roll. If a caught stealing ends the inning,
              the same batter leads off the next one.
            </p>
          </House>
        </Section>

        <Section id="pitchers">
          <p>
            A pitcher can pitch his IP worth of innings at full strength. After that he's tired, and every pitch he
            rolls takes a penalty that grows the longer he stays in. He always adds his full Control; tiredness only
            comes off the total.
          </p>
          <House
            title="Fatigue counts outs"
            book="count innings. Each inning past his IP is −1, and a pitcher who comes in mid-inning is charged a full inning, even with 1 or 2 outs."
          >
            <p>
              IP is counted in outs, 3 to an inning: IP 1 is 3 outs, IP 6 is 18. Once a pitcher has recorded that many
              outs he's −1, and he loses 1 more for every 3 outs after that. A reliever who gets the last out of an
              inning is fresh the next inning until he has 3 outs.
            </p>
          </House>
          <p>
            The defense can change pitchers at the start of an at-bat, once per at-bat. A new pitcher has to be a
            reliever or closer, and a pitcher who leaves can't come back.
          </p>
          <House
            title="When the starter can come out"
            book={`(2001) not before the 5th unless he's tired. The 2000 book has no limit. Our version comes from the 2004 rulebook.`}
          >
            <p>
              Your starter stays in through the {STARTER_SAFE_THROUGH_INNING}th inning unless he's given up{' '}
              {STARTER_RUN_LIMIT} runs.
            </p>
          </House>
        </Section>

        <Section id="bench">
          <p>
            At the start of an at-bat, the offense can send up a bench player to bat instead. He takes that batting spot
            and the player he replaced is out of the game. If he takes the field, players shift so everyone is somewhere
            he can play.
          </p>
          <House
            title="Bench from the 7th inning"
            book={`backups can pinch-hit any time but can't take the field before the 7th; one who pinch-hits earlier must be replaced. Our timing comes from the 2004 rulebook.`}
          >
            <p>
              The bench can't be used until the {BENCH_ALLOWED_FROM_INNING}th inning, or the bottom of the{' '}
              {BENCH_ALLOWED_FROM_INNING - 1}th for the home team. One pinch hitter per at-bat, plus another after a
              pitching change.
            </p>
          </House>
          <House title="Starters bat once first" book="no such limit.">
            <p>
              You can't pinch-hit for a starter who hasn't batted yet, unless the defense has just changed pitchers. Anyone
              can pinch-hit for the DH.
            </p>
          </House>
        </Section>

        <Section id="positions">
          <p>
            A player can play the positions listed on his card, at the Fielding shown. A catcher's number is his Arm.
            OF covers all three outfield spots, IF covers all four infield spots, and LF/RF covers both corners. Anyone
            can DH.
          </p>
          <House
            title="Infielders, outfielders and first base"
            book="a player can play only where his card says. The expert rules let anyone but a pitcher play first base, at −1 Fielding (−2 for a DH)."
          >
            <p>
              Any infielder can play any infield spot, any outfielder any outfield spot, and a DH can play first base.
              Off his card he fields at +0. Catchers only catch, and only catchers catch.
            </p>
          </House>
        </Section>

        <Section id="teams">
          <p>
            A team has a nine-man lineup with a DH, 4 starting pitchers, a bullpen of relievers and closers, and a bench.
            No player can be on a team twice. A bench player costs a {BENCH_COST_DIVISOR === 5 ? 'fifth' : `1/${BENCH_COST_DIVISOR}`}{' '}
            of his points, since he can't play a whole game.
          </p>
          <p>A real 2000 or 2001 team plays with its own cards: its best nine by points start, and the rest fill the bench and bullpen.</p>
          <House title={`Going over ${POINT_CAP.toLocaleString()} points`} book={`a team's players must total ${POINT_CAP.toLocaleString()} points or less.`}>
            <p>Any team can go over the cap. It's just marked Over cap.</p>
          </House>
          <House title={`Up to ${MAX_ROSTER} players`} book="exactly 20 players. Our limit comes from the 2004 rulebook.">
            <p>A team can carry up to {MAX_ROSTER} players.</p>
          </House>
        </Section>

        <Section id="cards">
          <p>The game uses the regular 2000 and 2001 sets, base and Pennant Run, 1,249 cards in all.</p>
          <House
            title="Caps on every card"
            book="no caps. A few 2001 cards print On-Base 11, and later cards go higher."
          >
            <p>On-Base tops out at 10 and Speed at 20 on every card.</p>
          </House>
          <House
            title="Later cards on saved teams"
            book="the 2002 and later cards don't work with the 2000 and 2001 sets. They use a different chart and bigger numbers."
          >
            <p>
              Our saved teams can use cards from 2002 on. Their charts stop at 20: any result that starts past 20 is
              dropped. They print Speed as a number, which counts as a letter for throws home: 18 and up is A, 13 to 17
              is B, 12 and under is C.
            </p>
          </House>
        </Section>

        <Section id="winning">
          <p>
            Nine innings. If the home team is ahead after the top of the 9th, it doesn't bat. If the home team takes the
            lead in the bottom of the 9th or later, the game ends right there. If it's tied after 9, keep playing full
            innings until someone is ahead at the end of one.
          </p>
        </Section>

        <Section id="sources">
          <p>The base rules come from Wizards of the Coast's own online rulebooks, saved by the Internet Archive:</p>
          <ul className="rules__list">
            <li>
              <a href={BOOK_2000}>MLB Showdown 2000 rulebook</a> (August 2000)
            </li>
            <li>
              <a href={BOOK_2001}>MLB Showdown 2001 online rulebook</a> (May 2001)
            </li>
          </ul>
        </Section>
      </main>
    </div>
  );
}
