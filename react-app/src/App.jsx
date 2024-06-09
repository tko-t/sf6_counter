import React, { useEffect, useState } from 'react';
import { CharaSelecter } from './components/character_select';
import SF6FrameData from './sf6_frames.csv';
import CsvReader from './lib/CsvReader'
import { HBox } from './components/HBox';
import { Modal } from './components/Modal';

export const App = () => {
  const [sf6FrameData, setSf6FrameData] = useState([]);
  const [characterList, setCharacterList] = useState([]);
  const [mySelf, setMySelf] = useState(null);
  const [enemy, setEnemy]   = useState(null);
  const [burnOut, setBurnOut] = useState(0);
  const [driverush, setDriverush] = useState(0);
  const [showModal, setShowModal] = useState(false);

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
        const exFrame  = isAffectedDriveRush(enemyRow.skillType, enemyRow.name) ?
          burnOut + driverush
          :
          burnOut;
        // バーンアウト中は殴られ硬直が4フレーム長くなる
        const eGuard   = parseInt(enemyRow.guard) + exFrame; // ガード硬直
        const eName    = enemyRow.name;                      // 技名
        const eCommand = enemyRow.command;                   // 敵方コマンド
        const fire     = parseInt(selfRow.fire);             // 発生
        const damage   = selfRow.damage;                     // ダメージ
        const command  = selfRow.command;                    // 自分コマンド
        const counterKey = `${enemyRow.name} ： ${eCommand}`; // 技名とコマンドでユニーク化
        const eKey     = enemyRow.key;                        // 敵英語名
        const imageFile = enemyRow.imageFile
        // 極端にデカい硬直の返しは教えてくれんでいい
        if(-20 < eGuard && -eGuard >= fire) {
          counter[counterKey] ||= {
            counters: [], eGuard, eName, eKey, imageFile
          }

          counter[counterKey]['counters'].push({
            sKey:  selfRow.key,
            sName: selfRow.name,
            sFire: fire,
            sDamage: damage,
            sCommand: command,
            sImageFile: selfRow.imageFile,
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
            <small>ガード後の距離、リーチの考慮なし</small>
            <small>burnoutはガード硬直4F増し</small>
            <small>driverushはガード硬直2F増し(通常、特殊技）</small>
            <small>[...]は不利フレーム</small>
            <small>20F以上の硬直は除外（見ればわかる）</small>
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

  const commandList = (key) => {
    if (!mySelf) return;
    if (!enemy) return;
    return (
      <div className="link-block">
        <a href={`https://www.streetfighter.com/6/ja-jp/character/${key}/movelist`} target="_blank">COMMAND LIST</a>
      </div>
    )
  };

  const [currentArts, setCurrentArts] = useState(null);
  const setDetailModal = ({artsName, char}) => {
    const arts = sf6FrameData.filter((row) => {
      return row.key == char && row.name == artsName
    })[0]

    setCurrentArts(arts)
    setShowModal(true)
  }

  const detailArts = () => {
    if (!currentArts) return;

    const char = currentArts.key
    const imageFile = `/images/${char}/${currentArts.imageFile}`
    const movieFile = `/movies/${char}/${currentArts.movieFile}`
    // style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url("${imageFile}")` } }
    return (
      <div className="modal">
        <video poster={imageFile} muted autoPlay loop className='arts-video'>
          <source src={movieFile} type="video/mp4" />
        </video>
        <table className="detail-arts">
          <tbody>
            <tr><td className="detail-arts-header">技名: </td><td className="detail-arts-body">{currentArts?.name}</td></tr>
            <tr><td className="detail-arts-header">発生: </td><td className="detail-arts-body">{currentArts?.fire}</td></tr>
            <tr><td className="detail-arts-header">持続: </td><td className="detail-arts-body">{currentArts?.fire}-{currentArts?.persistence}</td></tr>
            <tr><td className="detail-arts-header">硬直: </td><td className="detail-arts-body">{currentArts?.rigidity}</td></tr>
            <tr><td className="detail-arts-header">全体: </td><td className="detail-arts-body">{currentArts?.totalFrame}</td></tr>
            <tr><td className="detail-arts-header">硬直差[H]: </td><td className="detail-arts-body">{currentArts?.hit}</td></tr>
            <tr><td className="detail-arts-header">硬直差[G]: </td><td className="detail-arts-body">{currentArts?.guard}</td></tr>
            <tr><td className="detail-arts-header">キャンセル: </td><td className="detail-arts-body">{currentArts?.cancel}</td></tr>
            <tr><td className="detail-arts-header">ダメージ: </td><td className="detail-arts-body">{currentArts?.damage}</td></tr>
            <tr><td className="detail-arts-header">Dゲージ[H]: </td><td className="detail-arts-body">{currentArts?.dHit}</td></tr>
            <tr><td className="detail-arts-header">Dケージ[G]: </td><td className="detail-arts-body">{currentArts?.dGuard}</td></tr>
            <tr><td className="detail-arts-header">Dゲージ[P]: </td><td className="detail-arts-body">{currentArts?.dPunish}</td></tr>
            <tr><td className="detail-arts-header">SAゲージ: </td><td className="detail-arts-body">{currentArts?.saGauge}</td></tr>
            <tr><td className="detail-arts-header">属性: </td><td className="detail-arts-body">{currentArts?.attackType}</td></tr>
            <tr><td className="detail-arts-header">補正: </td><td className="detail-arts-body">{currentArts?.correction}</td></tr>
            <tr><td className="detail-arts-header">備考: </td><td className="detail-arts-body">
              { currentArts.skillType }<br></br>
              { currentArts.comment.split("@@EOL@@").map( (comment, idx) => (
                  <p className="comment-line" key={idx}>
                    { comment }
                  </p>
              ))}
            </td></tr>
          </tbody>
        </table>
        <small style={{ margin: "10px"}}>※ H: ヒット、G: ガード、P: パニカン</small>
      </div>
    )
  }

  return (
    <div>
      <Modal showModal={showModal} setShowModal={setShowModal}>
        { detailArts() }
      </Modal>
      <HBox>
        <div style={ { width: "100%" } }>
          <CharaSelecter placeholder="あなた" list={characterList} onChange={setMySelf}/>
          <div style={ { marginLeft: "10px", padding: "4px 8px 8px 0"} }>
            <input id="burnout" type="checkbox" onChange={ (e) => onBurnout(e) }/>
            <label htmlFor="burnout">burnout</label>
            { commandList(mySelf) }
          </div>
        </div>
        <div><span>VS</span></div>
        <div style={ { width: "100%" } }>
          <CharaSelecter placeholder="敵" list={characterList} onChange={setEnemy}/>
          <div style={ { marginLeft: "10px", padding: "4px 8px 8px 0"} }>
            <input id="driverush" type="checkbox" onChange={ (e) => onDriverush(e) }/>
            <label htmlFor="driverush">driverush</label>
            { commandList(enemy) }
          </div>
        </div>
      </HBox>
      { summaryHeader() }
      <div>
        { matchingTable.map((matching) => {
          const targetArtsKey = Object.keys(matching)[0]
          const targetArtsName = Object.values(matching)[0].eName
          const targetArtsFrame = Object.values(matching)[0].eGuard
          const counters = Object.values(matching)[0].counters
          const eKey = Object.values(matching)[0].eKey
          const imageFile = `/images/${eKey}/${Object.values(matching)[0].imageFile}`
          const enemyBtnStyle = Object.values(matching)[0].imageFile
            ? { backgroundImage: `url("${imageFile}")`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center'}
            : {}

          return (
            <details key={targetArtsKey}>
              <summary style={ { display: 'flex', justifyContent: "space-between"} }>
                <div>
                  <span style={ { minWidth: "40px", display: "inline-block" } }>[{targetArtsFrame}]</span>
                  <span>{ targetArtsKey }</span>
                </div>
                <div>
                  <button
                    style={ enemyBtnStyle }
                    onClick={ () => setDetailModal({artsName: targetArtsName, char: eKey }) }> </button>
                </div>
              </summary>
              { counters.map((counter, num) => {
                const counterImage = `/images/${counter.sKey}/${counter.sImageFile}`
                const counterBtnStyle = counter.sImageFile
                  ? { backgroundImage: `url("${counterImage}")`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { }
                return (
                  <div key={Math.random()} style={ { display: 'flex', justifyContent: "space-between", padding: "8px"} } className={`detail_item counter_${ num % 2 == 0 ? "a" : "b"}`}>
                    <div>
                      <span style={ { minWidth: "40px", display: "inline-block" } }>[{counter.sFire}]</span>
                      <span>{ counter.sName }：{ counter.sCommand }</span>
                    </div>
                    <div>
                      <button
                        style={ counterBtnStyle }
                        onClick={ () => setDetailModal({artsName: counter.sName, char: counter.sKey }) }> </button>
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
