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
  const [driverush, setDriverush] = useState(0);

  // csvロード
  useEffect(() => {
    CsvReader(SF6FrameData, setSf6FrameData)
  }, []);

  // キャラ表作成
  useEffect(() => {
    const uniqueCharacterList = {};
    sf6FrameData.map(row => {
      uniqueCharacterList[row.key] = row.char
    });
    setCharacterList(Object.keys(uniqueCharacterList).map( key => {
      return { value: key, label: uniqueCharacterList[key] }
    }));
  }, [sf6FrameData]);

  // "発生", "ダメージ", "ガード硬直" があって
  // 事前動作の不要な攻撃リスト
  const frameTableForSelf = {};
  const frameTableBySelf = () => {
    if (!frameTableForSelf[mySelf]) {
      const reg = /.*(中に|後に|時に|段目).*/
      frameTableForSelf[mySelf] = sf6FrameData.filter((row) => {
        return row.key == mySelf && row.fire && 0 < row.damage && row.guard && !reg.test(row.command) && !reg.test(row.name)
      })
    }
    return frameTableForSelf[mySelf];
  };

  // "ガード硬直" がある攻撃リスト
  const frameTableForEnemy = {};
  const frameTableByEnemy = () => {
    if (!frameTableForEnemy[enemy]) {
      frameTableForEnemy[enemy] = sf6FrameData.filter((row) => {
        return row.key == enemy && row.guard
      })
    }
    return frameTableForEnemy[enemy];
  };

  // 自分のキャラ選択
  // 敵のキャラ選択
  // バーンアウト
  // ドライブラッシュ
  useEffect(() => {
    if (!mySelf) return;
    if (!enemy) return;

    match()

  }, [enemy, mySelf, burnOut, driverush]);

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
  const isAffectedDriveRush = (skillType, skillName) => {
    return /(通常技|特殊技)/.test(skillType) && !/(中に|後に|段目)/.test(skillName);
  }

  const match = () => {
    setMatchingTable(frameTableByEnemy().map(enemyRow => {
      const counter = {}
      frameTableBySelf().map(selfRow => {
        const exFrame  = isAffectedDriveRush(enemyRow.skill_type, enemyRow.name) ?
          burnOut + driverush
          :
          burnOut;
        // バーンアウト中は殴られ硬直が4フレーム長くなる
        const eGuard   = parseInt(enemyRow.guard) + exFrame;
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
            <span>ガード後に殴り返せるかもリスト</span>
          </summary>
          <div className="detail_item coutions">
            <small>敵の不利フレームより速い発生技一覧</small>
            <small>ガード後の距離やリーチは考慮してないです</small>
            <small>バーンアウト中はガード硬直4F増し</small>
            <small>ドライブラッシュ中はガード硬直2F増し(通常技、特殊技）</small>
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

  const onDriverush = (e) => {
    if (e.target.checked == true) {
      setDriverush(2); // ドライブラッシュ中は殴り硬直が2フレーム短くなる
    } else {
      setDriverush(0);
    }
  }

  const command_list = (key) => {
    if (!mySelf) return;
    if (!enemy) return;
    return (
      <div className="link-block">
        <a href={`https://www.streetfighter.com/6/ja-jp/character/${key}/movelist`} target="_blank">COMMAND LIST</a>
      </div>
    )
  };

  return (
    <div>
      <HBox>
        <div style={ { width: "100%" } }>
          <CharaSelecter placeholder="あなた" list={characterList} onChange={setMySelf}/>
          <div style={ { marginLeft: "10px", padding: "4px 8px 8px 0"} }>
            <input id="burnout" type="checkbox" onChange={ (e) => onBurnout(e) }/>
            <label htmlFor="burnout">バーンアウト中</label>
            { command_list(mySelf) }
          </div>
        </div>
        <div><span>VS</span></div>
        <div style={ { width: "100%" } }>
          <CharaSelecter placeholder="敵" list={characterList} onChange={setEnemy}/>
          <div style={ { marginLeft: "10px", padding: "4px 8px 8px 0"} }>
            <input id="driverush" type="checkbox" onChange={ (e) => onDriverush(e) }/>
            <label htmlFor="driverush">ドライブラッシュ</label>
            { command_list(enemy) }
          </div>
        </div>
      </HBox>
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
                <span>{ targetArts }</span>
              </summary>
              { counters.map((counter, num) => {
                return (
                  <div key={Math.random()}  className={`detail_item counter_${ num % 2 == 0 ? "a" : "b"}`}>
                    <div>
                      <span>{ counter.sName }</span>
                    </div>
                    <div>
                      <span>発生：</span>
                      <span>{ counter.sFire }</span>
                    </div>
                    <div>
                      <span>コマンド：</span>
                      <span>{ counter.sCommand }</span>
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
