import React, { useEffect, useState } from 'react';
import { CharaSelecter } from './components/character_select';
import SF6FrameData from './sf6_frames.csv';
import CsvReader from './lib/CsvReader'
import { HBox } from './components/HBox';

export const App = () => {
  const [sf6FrameData, setSf6FrameData] = useState([]);
  const [characterList, setCharacterList] = useState([]);
  const [mySelf, setMySelf] = useState(null);
  const [enemy, setEnemy]   = useState(null);
  const [burnOut, setBurnOut] = useState(0);

  // csvロード
  useEffect(() => {
    CsvReader(SF6FrameData, setSf6FrameData)
  }, []);

  // キャラ表作成
  useEffect(() => {
    const uniqueCharacterList = new Set();
    sf6FrameData.map(row => {
      uniqueCharacterList.add(row['char'])
    });
    setCharacterList(Array.from(uniqueCharacterList).map( char => {
      return { value: char, label: char }
    }));
  }, [sf6FrameData]);

  // "発生", "ダメージ", "ガード硬直" があって
  // 事前動作の不要な攻撃リスト
  const frameTableForSelf = {};
  const frameTableBySelf = () => {
    if (!frameTableForSelf[mySelf]) {
      const reg = /.*(中に|後に|時に|段目).*/
      frameTableForSelf[mySelf] = sf6FrameData.filter((row) => {
        return row.char == mySelf && row.fire && 0 < row.damage && row.guard && !reg.test(row.command) && !reg.test(row.name)
      })
    }
    return frameTableForSelf[mySelf];
  };

  // "ガード硬直" がある攻撃リスト
  const frameTableForEnemy = {};
  const frameTableByEnemy = () => {
    if (!frameTableForEnemy[enemy]) {
      frameTableForEnemy[enemy] = sf6FrameData.filter((row) => {
        return row['char'] == enemy && row['guard']
      })
    }
    return frameTableForEnemy[enemy];
  };

  // 自分のキャラ選択
  useEffect(() => {
    if (!enemy) return;

    match()

  }, [mySelf, burnOut]);

  // 敵のキャラ選択
  useEffect(() => {
    if (!mySelf) return;

    match()

  }, [enemy, burnOut]);

  // 敵の行動のガード硬直より少ないフレームで発生できる技をフィルタ
  // {
  //   弱P: {
  //     counters: [{ sName: 弱P, sFire: 4, sDamage: 300, sCommand: PL }, ...]
  //     eGuard: -6
  //   },
  //   中K: {
  //     counters: [...],
  //     eGuard: -7
  //   }
  // }
  const [matchingTable, setMatchingTable] = useState([]);
  const match = () => {
    setMatchingTable(frameTableByEnemy().map(enemyRow => {
      const counter = {}
      frameTableBySelf().map(selfRow => {
        // バーンアウト中は殴られ硬直が4フレーム長くなる
        const eGuard   = parseInt(enemyRow.guard) + burnOut;
        const eCommand = enemyRow.command;
        const fire     = parseInt(selfRow.fire);
        const damage   = selfRow.damage;
        const command  = selfRow.command;
        const counterKey = `${enemyRow.name} ： ${eCommand}`;
        if(-eGuard >= fire) {
          counter[counterKey] ||= {
            counters: [], eGuard
          }

          counter[counterKey]['counters'].push({
            sName: selfRow.name,
            sFire: fire,
            sDamage: damage,
            sCommand: command,
          })
        }
      })
      if (0 < Object.keys(counter).length) {
        return counter
      }
    }).filter(v => v))
  }

  const summaryHeader = () => {
    if (matchingTable.length == 0) return;

    return (
      <div style={ { textAlign: 'center', width: "100%" } }>
        <details className="introduction">
          <summary>
            <span>ガード後に殴り返せるかもしれないリスト</span>
          </summary>
          <div className="detail_item coutions">
            <small>敵の不利フレームより速い発生を持つ技の一覧です</small>
            <small>ガード後の距離やリーチは考慮してないです</small>
            <small>[...]は不利フレーム</small>
            <small>202405 Ver.</small>
          </div>
        </details>
      </div>
    )
  }

  const onBurnout = (e) => {
    if (e.target.checked == true) {
      setBurnOut(4); // バーンアウト中は殴られ硬直が4フレーム長くなる
    } else {
      setBurnOut(0);
    }
  }

  return (
    <div>
      <HBox>
        <div style={ { width: "100%" } }>
          <CharaSelecter placeholder="あなた" list={characterList} onChange={setMySelf}/>
        </div>
        <div><span>VS</span></div>
        <div style={ { width: "100%" } }>
          <CharaSelecter placeholder="敵" list={characterList} onChange={setEnemy}/>
        </div>
      </HBox>
      <div style={ { marginLeft: "10px", padding: "4px 8px 8px 0"} }>
        <input id="burnout" type="checkbox" onChange={ (e) => onBurnout(e) }/>
        <label htmlFor="burnout">バーンアウト中</label>
      </div>
      { summaryHeader() }
      <div>
        { matchingTable.map((matching, idx) => {
          const targetArts = Object.keys(matching)[0]
          const targetArtsFrame = Object.values(matching)[0].eGuard
          const counters = Object.values(matching)[0].counters
          return (
            <details key={targetArts}>
              <summary>
                <span style={ { minWidth: "40px", display: "inline-block" } }>[{targetArtsFrame}]</span>
                <span>{targetArts}</span>
              </summary>
              { counters.map((counter, num) => {
                const counterName = counter.sName;
                const counterFireFrame = counter.sFire;
                const counterCommand = counter.sCommand;
                return (
                  <div key={Math.random()}  className={`detail_item counter_${ num % 2 == 0 ? "a" : "b"}`}>
                    <div>
                      <span>{ counterName}</span>
                    </div>
                    <div>
                      <span>発生：</span>
                      <span>{ counterFireFrame }</span>
                    </div>
                    <div>
                      <span>コマンド：</span>
                      <span>{counterCommand}</span>
                    </div>
                  </div>
                )
              })}
            </details>
          )
        })}
      </div>
    </div>
  );
};
