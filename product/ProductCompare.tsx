import React, { Component } from "react";
import { isEmpty, cloneDeep } from "lodash"
import CustomeButton from "../button/CustomeButton";
import { Link } from "react-router-dom";
import '../../_theme/product-compare.scss';
import { keyWithDisplayName } from '../general/DisplayName';
import { camelCaseToWords } from "../../_helpers/helper";
import { ShowRecursiveFields, ViewField, keyReplace, recursiveDiff, omitDeep } from "./Compare"
import { isObject } from "./ProductView";

const hiddedFileds = [
  "_id",
  "__v",
  "version",
  "productStatus",
  "modified",
  "slug",
  "isCategoryInClearance"
];

interface StateProps {
  oldProduct: any;
  product: any;
  handleComparison: Function;
}

interface State {
  loading: boolean;
  showFullView: boolean;
}

class ProductCompare extends Component<StateProps, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: false,
      showFullView: false
    };
  }

  handleDetailClick = (e: any) => {
    e.preventDefault();
    this.setState({ showFullView: !this.state.showFullView });
  };

  render(): JSX.Element {
    const { showFullView } = this.state;
    let { product, oldProduct } = this.props;
    let productMap: any = {}, oldProductMap: any = {};
    if (!isEmpty(product) && !isEmpty(oldProduct)) {
      // swap product;
      if ((product.version || 0) < (oldProduct.version || 0)) {
        [product, oldProduct] = [oldProduct, product];
      }

      let cloneProduct = cloneDeep(product)
      let cloneOldProduct = cloneDeep(oldProduct)
      omitDeep(cloneProduct);
      omitDeep(cloneOldProduct)
      let data = recursiveDiff(cloneProduct, cloneOldProduct, !showFullView)
      productMap = data[0];
      oldProductMap = data[1];
    }
    return (
      <div className="productCompare">
        <div className="row">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/products">Products</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {product.name}{" "}
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
          <div>
            <CustomeButton
              className="btn btn-info btn-md mb-4 mr-3"
              type="button"
              onClick={() => this.props.handleComparison(false)}
              name="Back"
            />
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12 text-right">
            <button className="btn btn-link" onClick={this.handleDetailClick}>
              Show {showFullView ? "less <<" : "more >>"}
            </button>
          </div>
        </div>
        {product && oldProduct && (
          <div className="row">
            <div className="col-sm-6">
              <h5 className="mb-3">Version: {String((oldProduct.version || 0))}</h5>
              {Object.keys(oldProductMap).map((key: string, index: number) => {
                if (hiddedFileds.indexOf(keyReplace(key)) === -1) {
                  return (
                    <div className={'col-md-12'} key={index}>
                      <div className={`form-group raw-view`} >
                        <h6>{keyWithDisplayName[keyReplace(key)] || camelCaseToWords(keyReplace(key))}</h6>
                        {isObject(oldProductMap[key]) && <ShowRecursiveFields value={oldProductMap[key]} pKey={[key]} isNew={false} />}
                        {!isObject(oldProductMap[key]) && <div className="detail field"><ViewField skey={[key]} value={[oldProductMap[key]]} isNew={false} /></div>}
                      </div>
                    </div>
                  )
                }
                return undefined;
              })}
            </div>
            <div className="col-sm-6">
              <h5 className="mb-3">Version: {String((product.version || 0))}</h5>
              {Object.keys(productMap).map((key: string, index: number) => {
                if (hiddedFileds.indexOf(keyReplace(key)) === -1) {
                  return (
                    <div className={'col-md-12'} key={index}>
                      <div className={`form-group raw-view }`} >
                        <h6>{keyWithDisplayName[keyReplace(key)] || camelCaseToWords(keyReplace(key))}</h6>
                        {isObject(productMap[key]) && <ShowRecursiveFields value={productMap[key]} pKey={[key]} isNew={true} />}
                        {!isObject(productMap[key]) && <div className="detail field"><ViewField skey={[key]} value={[productMap[key]]} isNew={true} /></div>}
                      </div>
                    </div>
                  )
                }
                return undefined;
              })}
            </div>
          </div>
        )}

      </div>
    );
  }
}

export default ProductCompare;
