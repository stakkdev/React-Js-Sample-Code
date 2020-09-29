import React, { Component } from 'react';
import { connect } from 'react-redux';
import { History } from 'history';
import { Link } from 'react-router-dom';
import { isEmpty, cloneDeep } from "lodash"

import { IProductState } from '../../reducers';
import { onApprove, onRevert, updateOptionsToState, getPendingProduct } from '../../actions';
import { camelCaseToWords, getObjectsDifference } from "../../_helpers/helper";
import CustomeButton from '../button/CustomeButton';
import { confirmAlert } from 'react-confirm-alert';
import '../../_theme/confirm-alert.scss';
import { keyWithDisplayName } from '../general/DisplayName';

import { ShowRecursiveFields, ViewField, recursiveDiff, keyReplace, omitDeep } from "./Compare"
import { isObject } from "./ProductView"


const hiddedFileds = [
  "_id",
  "__v",
  "version",
  "productStatus",
  "modified",
  "slug",
  "grouping",
  "isCategoryInClearance"
];

interface StateProps {
  productState: IProductState;
}
interface DispatchProps {
  getProductById: any;
  onApprove: any;
  onRevert: any;
  updateOptionsToState: any;
}

interface Props extends DispatchProps, StateProps {
  history: History;
  match: any;
}

interface State {
  product: any;
  loading: boolean;
  diffKeys: Array<string>;
  oldProduct: any;
  showFullView: boolean;
}

class PendingProduct extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      product: undefined,
      loading: false,
      diffKeys: [],
      oldProduct: undefined,
      showFullView: false
    };
    this.approveProduct = this.approveProduct.bind(this);
    this.handleDetailClick = this.handleDetailClick.bind(this);
    this.goBack = this.goBack.bind(this);
  }

  approveProduct() {
    const { id, version } = this.props.match.params;
    this.props.updateOptionsToState({ moveToList: true });
    this.props.onApprove(id, version);
  }

  goBack(): void {
    this.props.history.goBack();
  }

  revert = () => {
    confirmAlert({
      title: 'Confirm to submit',
      message: 'Are you sure you want to revert the changes?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => {
            this.revertProduct();
          }
        },
        {
          label: 'No',
          onClick: () => { }
        }
      ]
    })
  }

  revertProduct() {
    const { product } = this.state;
    this.props.onRevert(product);
  }

  componentDidMount() {
    const { id, version } = this.props.match.params;
    this.props.getProductById(id, version ? version : 0);
  }

  setDifference(newProduct: any, oldProduct: any) {
    if (oldProduct) {
      const diff = getObjectsDifference(newProduct, oldProduct);
      const _diffKeys = Object.keys(diff);
      this.setState({ diffKeys: _diffKeys });
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const isData = nextProps.productState.productsDetail.hasOwnProperty(this.props.match.params.id);
    const { product } = this.state;
    if (!nextProps.productState.loading && isData && !product) {
      this.setState({
        product: nextProps.productState.productsDetail[this.props.match.params.id],
      }, () => {
        const oldProduct = nextProps.productState.productsDetail[this.props.match.params.id + '_old']
        if (oldProduct) {
          this.setState({ oldProduct: oldProduct })
          this.setDifference(this.state.product, oldProduct);
        }
      });
      return true;
    }
    return true;
  }


  handleDetailClick(e: any) {
    e.preventDefault();
    this.setState({ showFullView: !this.state.showFullView })
  }

  render(): JSX.Element {
    const { showFullView, loading } = this.state;
    let { product, oldProduct } = this.state;
    let productMap: any = {}, oldProductMap: any = {};
    if (!isEmpty(product) && !isEmpty(oldProduct)) {
      if ((product.version || 0) < (oldProduct.version || 0)) {
        [product, oldProduct] = [oldProduct, product];
      }
      let cloneProduct = cloneDeep(product)
      let cloneOldProduct = cloneDeep(oldProduct)
      omitDeep(cloneProduct);
      omitDeep(cloneOldProduct)
      let data = recursiveDiff(cloneProduct, cloneOldProduct, !showFullView)
      productMap = cloneDeep(data[0]);
      oldProductMap = cloneDeep(data[1]);

    }
    return (
      <div className="pending-product">
        <React.Fragment>
          <div className="row">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
                {product && <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
                }
              </ol>
            </nav>
          </div>
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
            <div>
              <CustomeButton className="btn btn-info btn-md mb-4" type="button" onClick={this.goBack} name="Back"></CustomeButton>
            </div>
            {product &&
              <div>
                <CustomeButton className="btn btn-outline-danger mb-4 mr-3" type="button" onClick={this.revert} name="Revert" />
                <CustomeButton className="btn btn-info btn-md mb-4" type="button" onClick={this.approveProduct} name={loading ? 'Approving..' : 'Approve'} />
              </div>
            }
          </div>
        </React.Fragment>
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
        <div className="row">
          <div className="col-sm-12 text-right">
            <button className="btn btn-link" onClick={this.handleDetailClick}>Show {showFullView ? 'less <<' : 'more >>'}</button>
          </div>
        </div>
      </div>
    )

  }

  componentDidUpdate(prevProps: Props) {
    if (!this.props.productState.productApproving && prevProps.productState.productApproving !== this.props.productState.productApproving && !prevProps.productState.error) {
      this.props.history.push('/products');
    }
    if (!this.props.productState.productReverting && prevProps.productState.productReverting !== this.props.productState.productReverting && !prevProps.productState.error) {
      this.props.history.push('/products');
    }
  }
}

const mapStateToProps = (state: any): StateProps => {
  return {
    productState: state.products
  };
}

const mapDispatchToProps: DispatchProps = {
  getProductById: getPendingProduct,
  onApprove: onApprove,
  onRevert: onRevert,
  updateOptionsToState: updateOptionsToState
}

export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(PendingProduct);