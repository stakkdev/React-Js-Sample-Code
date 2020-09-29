
import React from "react";
import { cloneDeep, forIn, isObject, difference, range, first, each } from "lodash"
import { isArrayOfObject, isArray, isObject as isObjectMy } from './ProductView'
import { getLocalTime } from '../../util/globalization';
import { camelCaseToWords, validateDate, removeWhiteSpace } from "../../_helpers/helper";
import { keyWithDisplayName } from '../general/DisplayName';

const str = JSON.stringify;

export const keyReplace = (value: string) => (
  value.replace(/_\$(REMOVED|UPDATED|ADDED|ASITAS)\$/, "")
)

interface RecursiveFieldProps {
  isNew: boolean;
  value: any;
  pKey: Array<string>;
}

const hiddedFileds = [
  "_id",
  "__v",
  "version",
  "productStatus",
  "modified",
  "slug",
  "isCategoryInClearance"
];

const compareBasedOnIndexing = (n: any, o: any) => {

  let cn = cloneDeep(n);
  let co = cloneDeep(o);

  for (const i of n) {
    let findIndex = co.findIndex((item: any) => str(item) === str(i))

    if (findIndex > -1) {
      let oi = co[findIndex];
      let nfindIndex = cn.findIndex((item: any) => str(item) === str(oi))

      co.splice(findIndex, 1)
      cn.splice(nfindIndex, 1)
    }
  }

  return [cn, co];
}

export const omitDeep = (obj: any, omitKeys: Array<string> = hiddedFileds) => {
  forIn(obj, function (value, key) {
    if (isObject(value)) {
      omitDeep(value, omitKeys);
    } else if (omitKeys.includes(key)) {
      delete obj[key];
    }
  });
}

function isEmpty(obj: Array<any> | Object) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      return false;
  }
  return true;
}

export const recursiveDiff = (newVal: any, oldVal: any, isDiffOnly: boolean) => {
  var oldValKeys = Object.keys(oldVal);
  var newValKeys = Object.keys(newVal);
  let deleted = difference(oldValKeys, newValKeys);

  let diffNewVal: any = {}, diffOldVal: any = {};

  [...newValKeys, ...deleted].map(key => {

    if (newVal.hasOwnProperty(key) && oldVal.hasOwnProperty(key)) {
      if (
        ((typeof oldVal[key] === 'string' && typeof newVal[key] === 'string')
          && removeWhiteSpace('', oldVal[key]) === removeWhiteSpace('', newVal[key]))
        || JSON.stringify(oldVal[key]) === JSON.stringify(newVal[key])
      ) {
        if (!isDiffOnly) {
          diffNewVal[key + "_$ASITAS$"] = newVal[key];
          diffOldVal[key] = oldVal[key];
        }
      } else {
        if (typeof newVal[key] === 'object') {
          if (Array.isArray(newVal[key])) {
            if (typeof newVal[key][0] === "object") {

              let data: Array<any> = [];
              let old: Array<any> = [];
              if (/(ingredient|origin_products)/.test(key)) {
                for (let item in range(oldVal[key].length > newVal[key].length ? oldVal[key].length : newVal[key].length)) {
                  if (newVal[key][item] && oldVal[key][item]) {
                    let iData = recursiveDiff(newVal[key][item], oldVal[key][item], isDiffOnly);
                    if (!isEmpty(iData[0])) data.push(iData[0]);
                    if (!isEmpty(iData[1])) old.push(iData[1])
                  } else if (newVal[key][item] && !oldVal[key][item]) {
                    let iData = recursiveDiff(newVal[key][item], {}, isDiffOnly);
                    if (!isEmpty(iData[0])) data.push(iData[0]);
                    //old.push({})
                  } else {
                    let iData = recursiveDiff({}, oldVal[key][item], isDiffOnly);
                    data.push({ "_$REMOVED$": '[[removed]]' });
                    if (!isEmpty(iData[1])) old.push(iData[1])
                  }
                }
                if (!isEmpty(data)) diffNewVal[key + "_$UPDATED$"] = data;
                if (!isEmpty(old)) diffOldVal[key] = old;
              } else {
                let cNewVal = cloneDeep(newVal[key]);
                let cOldVal = cloneDeep(oldVal[key]);
                each(range(oldVal[key].length > newVal[key].length ? oldVal[key].length : newVal[key].length), () => {
                  let findNew: any = first(cNewVal) || {};
                  let findOld = cOldVal.find((item: any) => str(item) === str(findNew)) || {}

                  if (findNew && findOld) {
                    if (isEmpty(findOld)) {
                      let idx = cNewVal.findIndex((item: any) => str(item) === str(findNew))
                      findOld = cOldVal[idx] || {};
                    }
                    let iData = recursiveDiff(findNew, findOld, isDiffOnly);

                    if (!isEmpty(iData[0])) {
                      data.push(iData[0]);
                    }
                    if (!isEmpty(iData[1])) old.push(iData[1])
                  } else if (findNew && !findOld) {
                    let iData = recursiveDiff(findNew, {}, isDiffOnly);
                    if (!isEmpty(iData[0])) data.push(iData[0]);
                    //old.push({})
                  } else {
                    let iData = recursiveDiff({}, findOld, isDiffOnly);
                    data.push({ "_$REMOVED$": '[[removed]]' });
                    if (!isEmpty(iData[1])) old.push(iData[1])
                  }

                  if (!isEmpty(findNew)) {
                    let idx = cNewVal.findIndex((item: any) => str(item) === str(findNew))
                    cNewVal.splice(idx, 1);

                  }

                  if (!isEmpty(findOld)) {
                    let idx = cOldVal.findIndex((item: any) => str(item) === str(findOld))
                    cOldVal.splice(idx, 1);
                  }
                })
                if (!isEmpty(data)) diffNewVal[key + "_$UPDATED$"] = data;

                if (!isEmpty(old)) diffOldVal[key] = old;
              }
            } else {
              if (/ingredient/.test(key)) {
                if (!isEmpty(newVal[key])) diffNewVal[key + "_$UPDATED$"] = newVal[key];
                if (!isEmpty(oldVal[key])) diffOldVal[key] = oldVal[key];
              } else {
                let cData = compareBasedOnIndexing(newVal[key], oldVal[key]);
                if (isEmpty(cData[0]) && isEmpty(cData[1])) {
                  if (!isDiffOnly) {
                    diffNewVal[key + "_$ASITAS$"] = newVal[key];
                    diffOldVal[key] = oldVal[key];
                  }
                } else {
                  if (!isEmpty(newVal[key])) diffNewVal[key + "_$UPDATED$"] = newVal[key];
                  if (!isEmpty(oldVal[key])) diffOldVal[key] = oldVal[key];
                }
              }
            }
          } else {
            let data = recursiveDiff(newVal[key], oldVal[key] || {}, isDiffOnly)
            if (!isEmpty(data[0])) diffNewVal[key + "_$UPDATED$"] = data[0]
            if (!isEmpty(data[1])) diffOldVal[key] = data[1]
          }
        } else {
          if (!isEmpty(newVal)) diffNewVal[key + "_$UPDATED$"] = newVal[key];
          if (!isEmpty(oldVal[key])) diffOldVal[key] = oldVal[key];
        }
      }
    } else if (newVal.hasOwnProperty(key) && !oldVal.hasOwnProperty(key)) {
      diffNewVal[key + "_$ADDED$"] = newVal[key];
    } else {
      diffNewVal[key + "_$REMOVED$"] = "[[removed]]";
      diffOldVal[key] = oldVal[key];
    }
    return undefined;
  })
  return [diffNewVal, diffOldVal];
}

export const ShowRecursiveFields = (props: RecursiveFieldProps) => {
  let { value, pKey, ...rest } = props;
  return (
    <div className={Array.isArray(value) ? '' : "pl-3 "}>
      <div className={'order-sm-first ' + getChangeClass(pKey, value)}>{
        Object.keys(value).map((item: any, index: number) => {
          let child = [...pKey, item];
          return (
            <React.Fragment key={`recursive-` + item}>
              {isObjectMy(value[item]) && value[item] && <div className={"form-group "}>
                <div className="detail field " ><b>{keyWithDisplayName[keyReplace(item)] || camelCaseToWords(keyReplace(item))}</b></div>
                {<ShowRecursiveFields value={value[item]} pKey={child} {...rest} />}
              </div>}
              {
                (!isObjectMy(value[item]) || !value[item])
                && hiddedFileds.indexOf(keyReplace(item)) === -1 && <div className="detail field">
                  <b>{keyWithDisplayName[keyReplace(item)] || camelCaseToWords(keyReplace(item))}</b>
                  {isArray(value[item])
                    ? value[item].join(', ')
                    : <ViewField skey={child} value={[value[item]]} {...rest} />}
                </div>
              }
            </React.Fragment>
          )
        })
      }
      </div>
    </div>
  )
}

const getChangeClass = (pKey: any, value: any) => {
  return (/_\$(REMOVED|ADDED)\$/.test(pKey.slice(-1)[0])
    || (/_\$(UPDATED)\$/.test(pKey.slice(-1)[0]) && !isArrayOfObject(value)))
    ? 'red-marked2' : '';
}
const compareValue = (product: any, oldProduct: any, sKey: Array<string>, isNew: boolean) => {
  return (/_\$(REMOVED|UPDATED|ADDED)\$/.test(sKey.slice(-1)[0]) && isNew) ? 'red-marked' : '';
}

export const ViewField = (props: any) => {
  let { skey, product, oldProduct, isNew } = props;
  let value = props.value[0];
  return (<>
    {<div className={compareValue(product, oldProduct, skey, isNew)} dangerouslySetInnerHTML={{ __html: (skey.slice(-1)[0] === 'skuId' ? value : validateDate(value) ? getLocalTime(value) : Array.isArray(value) ? value.join(', ') : String(value)) }} />}
  </>)
}