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
  // 自分用
  const frameTableForSelf = {};
  const frameTableBySelf = () => {
    if (!frameTableForSelf[mySelf]) {
      const reg = /.*(中に|後に).*/
      frameTableForSelf[mySelf] = sf6FrameData.filter((row) => {
        return row.char == mySelf && row.fire && 0 < row.damage && row.guard && !reg.test(row.command)
      })
    }
    return frameTableForSelf[mySelf];
  };

  // "ガード硬直" がある攻撃リスト
  // 敵用
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

    frameTableBySelf()
    match()

  }, [mySelf]);

  // 敵のキャラ選択
  useEffect(() => {
    if (!mySelf) return;

    frameTableByEnemy()
    match()

  }, [enemy]);

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
        if(-enemyRow.guard >= selfRow.fire) {
          counter[enemyRow.name] ||= {
            counters: [], eGuard: enemyRow.guard
          }

          counter[enemyRow.name]['counters'].push({
            sName: selfRow.name,
            sFire: selfRow.fire,
            sDamage: selfRow.damage,
            sCommand: selfRow.command,
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
        <span style={ { fontWeight: 'bold'} }>ガード後に殴り返せるかもしれないリスト</span>
      </div>
    )
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
      { summaryHeader() }
      <div>
        { matchingTable.map((matching, idx) => {
          const targetArts = Object.keys(matching)[0]
          const targetArtsFrame = Object.values(matching)[0].eGuard
          const counters = Object.values(matching)[0].counters
          return (
            <details key={idx}>
              <summary>{`${targetArts}(${targetArtsFrame})`}</summary>
              <div>
              { counters.map(counter => {
                const counterName = counter.sName;
                const counterFireFrame = counter.sFire;
                const counterCommand = counter.command;
                return (
                  <div key={Math.random()}>
                    <p>{`${counterName}[${counterFireFrame}]`}</p>
                    <p>{counterCommand}</p>
                  </div>
                )
              })}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  );
};
