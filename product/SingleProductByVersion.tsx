import React, { Component } from 'react';
import { connect } from 'react-redux';
import { History, Location } from 'history';
import { map, uniq } from 'lodash';
import { IAuthenticationState, IProductState, IVersionState } from '../../reducers';
import { getProductByIdVersion, onUpdate, updateOptionsToState, getOtherProductByIdVersion, getSignedUrlFromS3 } from '../../actions';
import { Link } from 'react-router-dom';
import { confirmAlert } from 'react-confirm-alert';
import '../../_theme/confirm-alert.scss';
import { TabsComponent, ITab } from "../tabs/Tabs";
import { getObjectsDifference } from "../../_helpers/helper";
import CustomeButton from '../button/CustomeButton';
import { getVersions, getLatestVersion } from "../../actions";
import PimSmartTable from '../smart-table/PimSmartTable';
import ProductCompare from './ProductCompare';
import { singleProductHeader } from "../../pim_table_headers";
import { ProductView } from "./ProductView";
import { PRODUCT_STATUS } from '../../constants';

interface StateProps {
  authentication: IAuthenticationState;
  productState: IProductState;
  versionState: IVersionState;
}
interface DispatchProps {
  getProductByIdVersion: any;
  onUpdate: any;
  updateOptionsToState: any;
  getVersions: any;
  getOtherProductByIdVersion: any;
  getSignedUrlFromS3: Function;
  getLatestVersion: Function;
}
interface Props extends DispatchProps, StateProps {
  history: History;
  location: Location;
  match: any;
}
interface State {
  product: any;
  initialProductState: any;
  loading: boolean;
  editable: boolean;
  showEditView: boolean;
  isProductEditable: boolean;
  diffKeys: Array<string>;
  oldProduct: any;
  updating: boolean;
  slideIndex: number;
  tab: number;
  compareVersion: boolean;
  latestVersionId: number;
  selectedTab: ITab | undefined;
}
class SingleProductByVersion extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      product: undefined,
      initialProductState: undefined,
      loading: false,
      editable: false,
      showEditView: false,
      isProductEditable: false,
      diffKeys: [],
      oldProduct: undefined,
      updating: false,
      slideIndex: 1,
      tab: 0,
      compareVersion: false,
      latestVersionId: 0,
      selectedTab: undefined
    };
    this.toggleEditView = this.toggleEditView.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.goBack = this.goBack.bind(this);
    this.revertToProductVersion = this.revertToProductVersion.bind(this);
    this.latestVersion = this.latestVersion.bind(this);
    this.certLinkClick = this.certLinkClick.bind(this);
  }
  revert = () => {
    confirmAlert({
      title: 'Confirm to submit',
      message: 'Are you sure you want to revert product to this version?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => {
            this.revertToProductVersion();
          }
        },
        {
          label: 'No',
          onClick: () => { }
        }
      ]
    })
  }

  public componentWillMount() {
    const { authentication, versionState } = this.props;
    const { id, version } = this.props.match.params;
    this.props.getProductByIdVersion(id, version);
    this.props.getLatestVersion(id);
    let latestVersionId: number = 0;
    if (versionState.latestVersion) {
      latestVersionId = versionState.latestVersion.version;
    }
    this.setState({ editable: (authentication.appUser.role === "ADMIN"), latestVersionId });
  }

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const isData = nextProps.productState.productsDetail.hasOwnProperty(this.props.match.params.id);
    if (this.props.match.params.version !== nextProps.match.params.version) {
      const { id, version } = nextProps.match.params;
      this.props.getProductByIdVersion(id, version);
      this.setState({ tab: 0 });
      return true;
    }
    const { product } = this.state;
    if (!nextProps.productState.loading && isData && !product) {
      this.setUpdateProductState(nextProps);
      if (this.props.productState.productsDetail.isProductEditable) {
        this.setState({
          isProductEditable: true
        });
      }
      return true;
    }
    if (this.state.updating && !nextProps.productState.loading && !nextProps.productState.error) {
      this.props.history.push('/products');
    }
    if (nextProps.productState.productsDetail[this.props.match.params.id] && nextState.product && nextProps.productState.productsDetail[this.props.match.params.id].version !== nextState.product.version) {
      this.setUpdateProductState(nextProps);
    }

    if (nextProps.versionState.loading !== this.props.versionState.loading) {
      if (nextProps.versionState.latestVersion) {
        this.setState({
          latestVersionId: nextProps.versionState.latestVersion.version
        });
      }
    }
    return true;
  }

  setUpdateProductState(nextProps: Props) {
    this.setState({
      product: nextProps.productState.productsDetail[this.props.match.params.id],
      initialProductState: Object.assign({}, nextProps.productState.productsDetail[this.props.match.params.id] || {})
    }, () => {
      const oldProduct = nextProps.productState.productsDetail[this.props.match.params.id + '_old']
      if (oldProduct) {
        this.setState({ oldProduct: oldProduct })
        this.setDifference(this.state.product, oldProduct);
      }
    });
  }

  setDifference(newProduct: any, oldProduct: any) {
    if (oldProduct) {
      const diff = getObjectsDifference(newProduct, oldProduct);
      const _diffKeys = Object.keys(diff);
      this.setState({ diffKeys: _diffKeys });
    }
  }

  certLinkClick(event: MouseEvent, fileLink: string) {
    event.stopPropagation();
    event.preventDefault();
    this.props.getSignedUrlFromS3(fileLink);
  }

  updateProduct() {
    const { product } = this.state;
    this.setState({
      initialProductState: Object.assign({}, product),
      updating: true
    }, () => {
      this.props.updateOptionsToState({ moveToList: true })
      this.props.onUpdate(product.skuId, product)
    });
  }

  toggleEditView() {
    this.setState({ showEditView: !this.state.showEditView, product: Object.assign({}, this.state.initialProductState) });
  }


  goBack(): void {
    this.props.updateOptionsToState({ moveToList: true })
    this.props.history.goBack();
  }

  latestVersion(): void {
    const { product, latestVersionId } = this.state;
    this.props.history.push('/products/version/' + product.skuId + '/' + latestVersionId);
  }

  revertToProductVersion() {
    const { product } = this.state;
    product['source'] = 'REVERT';
    this.props.onUpdate(product.skuId, product)
    //add new version with current version's data, as "NOT APPROVED"
  }

  public handleTabChange = (tab: number) => {
    this.setState({ tab });
  };

  public handleComparison = (compareVersion: boolean) => {
    this.setState({ compareVersion });
  }

  render(): JSX.Element {
    const key = Object.keys(this.props.productState.productsDetail)[0];
    if (this.state.compareVersion) {
      return (<ProductCompare
        oldProduct={this.props.productState.productsDetail[key]}
        product={this.props.productState.otherProductsDetail}
        handleComparison={this.handleComparison} />)
    }
    const { product, isProductEditable, latestVersionId } = this.state;
    const { authentication } = this.props;
    let tabs: ITab[] = [
      { slug: 'COMMON', text: "Common" }
    ];

    if (product) {
      const origins = map(uniq(map(product.origin_products, 'origin')), (item) => {
        return { slug: item.toUpperCase(), text: item }
      });
      tabs = [...tabs, ...origins];

      if (authentication.appUser && authentication.appUser.role === "ADMIN") {
        tabs = [...tabs, { slug: "HISTORY", text: "History" }];
      }
    }

    return (
      <React.Fragment>
        {product &&
          <React.Fragment>
            <div className="row">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
                  <li className="breadcrumb-item active" aria-current="page">{product.name} <span className="active"> {product["version"] ? ' (Version ' + product["version"] + ')' : ''}</span></li>
                </ol>
              </nav>
            </div>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
              <div>
                <CustomeButton className="btn btn-info btn-md mb-4 mr-3" type="button" onClick={this.goBack} name="Back"></CustomeButton>
                {
                  latestVersionId !== product.version
                  && <CustomeButton className="btn btn-info btn-md mb-4" type="button" onClick={this.latestVersion} name="Latest Version" />
                }
              </div>

              <div>
                <h1 className="h2">{product.ProductName}</h1>
                <div>
                  <div className="form-group">
                    {product['productStatus'] !== PRODUCT_STATUS.ACTIVE && <CustomeButton className="btn btn-info btn-md mb-4" type="button" disabled={!isProductEditable} onClick={this.revert} name="Revert"></CustomeButton>}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <TabsComponent tabItems={tabs} initialSelected={tabs[0]} onTabChange={(selectedTab: ITab, tab: number) => this.setState({ selectedTab, tab })} >
                {this.renderActiveTab(tabs)}
              </TabsComponent>
            </div>
          </React.Fragment>}
      </React.Fragment>);
  }

  private renderActiveTab(tabs: Array<ITab>): JSX.Element {
    const { product, showEditView, editable, loading, selectedTab } = this.state;
    const { versionState } = this.props;
    if (selectedTab && selectedTab.slug === "DOCUMENTS") {
      return <div>Document</div>

    } else if (selectedTab && selectedTab.slug === "HISTORY") {
      return <React.Fragment>
        <PimSmartTable
          actionOnMangeActivities={getVersions}
          loading={loading}
          data={versionState.versionList}
          totalRecords={versionState.totalData}
          headers={singleProductHeader}
          filterData={true}
          isSelectable={true} />
      </React.Fragment>
    } else {
      return <div className="col-sm-12">
        <div className="row">
          <ProductView
            editViewForDoc={() => ''}
            product={product}
            showEditView={showEditView}
            editable={editable}
            tabs={tabs}
            tab={this.state.tab}
            certLinkClick={this.certLinkClick}
          />

        </div>
      </div>
    }
  }
}

const mapStateToProps = (state: any): StateProps => {
  return {
    authentication: state.authentication,
    productState: state.products,
    versionState: state.version
  };
}

const mapDispatchToProps: DispatchProps = {
  getProductByIdVersion: getProductByIdVersion,
  onUpdate: onUpdate,
  updateOptionsToState: updateOptionsToState,
  getVersions: getVersions,
  getOtherProductByIdVersion: getOtherProductByIdVersion,
  getSignedUrlFromS3: getSignedUrlFromS3,
  getLatestVersion: getLatestVersion
}

export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(SingleProductByVersion);