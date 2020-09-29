import React, { Component } from "react";
import { connect } from "react-redux";
import { History } from "history";
import { map, filter, cloneDeep, uniqBy, isEmpty, set } from "lodash";
import { ButtonGroup, Button } from "reactstrap";
import { Link } from "react-router-dom";

import {
  IAuthenticationState,
  IProductState,
  IVersionState,
  IDocumentState,
  CONFIGURATION_TYPE,
  IPaginatorState,
  IPaginatorRequestActionCreator,
  getPaginatorState,
  mediaPagination,
  IS3FlieState,
  getMasterState,
  IMasterApiState,
} from "../../reducers";
import {
  getProductById,
  onUpdate,
  updateOptionsToState,
  getProductByIdVersion,
  getOtherProductByIdVersion,
  showModal,
  hideModal,
  onFileUpload,
  getSignedUrlFromS3,
  getSkuDocuments,
  getConfigurationByType,
} from "../../actions";

import { getObjectsDifference, camelCaseToWords } from "../../_helpers/helper";
import CustomeButton from "../button/CustomeButton";
import { getVersions } from "../../actions/version";
import PimSmartTable from "../smart-table/PimSmartTable";
import "../../_theme/confirm-alert.scss";
import ProductCompare from "./ProductCompare";
import {
  singleProductHeader,
  skuDocsHeader,
  mediaHeaderForProduct,
} from "../../pim_table_headers";
import { ProductView } from "./ProductView";
import { recursiveDiff } from "./Compare";
import { ModalsType } from "../general/ModalManager";
import { downloadFile } from "../../util";
import { TabsComponent, ITab } from "../tabs/Tabs";
import { confirmAlert } from "react-confirm-alert";
import { Image } from "semantic-ui-react";

interface StateProps {
  authentication: IAuthenticationState;
  productState: IProductState;
  versionState: IVersionState;
  skuDocumentState: IDocumentState;
  configureUiState: any;
  mediaPaginatorState: IPaginatorState;
  s3FileState: IS3FlieState;
  permissions: any;
}
interface DispatchProps {
  getProductById: any;
  onUpdate: any;
  updateOptionsToState: any;
  getVersions: any;
  getOtherProductByIdVersion: any;
  getProductByIdVersion: any;
  hideModal: any;
  showModal: any;
  onFileUpload: any;
  getSignedUrlFromS3: Function;
  getSkuDocuments: Function;
  getTabsRequest: Function;
  requestMediaPage: IPaginatorRequestActionCreator;
}
interface Props extends DispatchProps, StateProps {
  history: History;
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
  _clearFilter: boolean;
  compareVersion: boolean;
  tab: number;
  isReadyToUpdate: boolean;
  originalProduct: any;
  selectedVersionsIds: Array<string>;
  selectedVersions: Array<string>;
  selectedTab: ITab | undefined;
  getTabId: string;
  tabItems: ITab[];
}
class SingleProduct extends Component<Props, State> {
  downloadRef: any;
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
      _clearFilter: true,
      compareVersion: false,
      tab: 0,
      isReadyToUpdate: false,
      originalProduct: {},
      selectedVersionsIds: [],
      selectedVersions: [],
      selectedTab: undefined,
      getTabId: "",
      tabItems: [],
    };
    this.toggleEditView = this.toggleEditView.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.goBack = this.goBack.bind(this);
    this.handleDownloadClick = this.handleDownloadClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.certLinkClick = this.certLinkClick.bind(this);
    this.getProductVersion = this.getProductVersion.bind(this);
    this._handleOnRowSelect = this._handleOnRowSelect.bind(this);
    this.handleComparision = this.handleComparision.bind(this);
  }

  public componentDidMount() {
    const { authentication } = this.props;
    this.props.getTabsRequest(CONFIGURATION_TYPE.UI_CONFIGURATION);
    this.setState({
      editable:
        authentication.appUser && authentication.appUser.role === "ADMIN",
    });
    const { id, version } = this.props.match.params;
    this.props.getProductById(id, version ? { v: version } : {});
  }

  certLinkClick(event: MouseEvent, fileLink: string) {
    event.stopPropagation();
    event.preventDefault();
    this.props.getSignedUrlFromS3(fileLink);
  }
  _handleOnRowSelect = (row: any, isSelected: boolean) => {
    let { selectedVersionsIds, selectedVersions } = this.state;
    if (isSelected) {
      selectedVersions.push(row.version);
      selectedVersionsIds.push(row._id);
    } else {
      selectedVersionsIds = filter(selectedVersionsIds, function (
        selectedVersionsId
      ) {
        return selectedVersionsId !== row._id;
      });
      selectedVersions = filter(selectedVersions, function (
        selectedVersionsSku
      ) {
        return selectedVersionsSku !== row.version;
      });
    }
    this.setState({
      selectedVersionsIds,
      selectedVersions,
    });
  };

  handleComparision = () => {
    let { selectedVersions } = this.state;
    let skuID = this.props.match.params.id;
    this.props.getProductByIdVersion(skuID, selectedVersions[0]);
    this.props.getOtherProductByIdVersion(skuID, selectedVersions[1]);
    this.handleComparison(true);
  };

  public componentDidUpdate(prevsProps: Props): void {
    const isData = this.props.productState.productsDetail.hasOwnProperty(
      this.props.match.params.id
    );
    if (
      (prevsProps.productState.loading && isData) ||
      (prevsProps.productState.loading &&
        prevsProps.productState.pdfUploaded !==
        this.props.productState.pdfUploaded)
    ) {
      this.setState(
        {
          product: this.props.productState.productsDetail[
            this.props.match.params.id
          ],
          initialProductState: Object.assign(
            {},
            this.props.productState.productsDetail[
            this.props.match.params.id
            ] || {}
          ),
          originalProduct: cloneDeep(
            this.props.productState.productsDetail[this.props.match.params.id]
          ),
        },
        () => {
          this.setTabItems();
          const oldProduct = this.props.productState.productsDetail[
            this.props.match.params.id + "_old"
          ];
          if (oldProduct) {
            this.setState({ oldProduct: oldProduct });
            this.setDifference(this.state.product, oldProduct);
          }
        }
      );
      if (this.props.productState.productsDetail.isProductEditable) {
        this.setState({
          isProductEditable: true,
        });
      }
    }

    if (
      prevsProps.productState.pdfUploaded !==
      this.props.productState.pdfUploaded
    ) {
      const { id, version } = this.props.match.params;
      this.props.getProductById(id, version ? { v: version } : {});
    }
    if (prevsProps.s3FileState.loading && this.props.s3FileState.downloadUrl) {
      this.downloadRef.href = this.props.s3FileState.downloadUrl;
      this.downloadRef.download = "file";
      this.downloadRef.click();
    }
  }

  setDifference(newProduct: any, oldProduct: any) {
    if (oldProduct) {
      const diff = getObjectsDifference(newProduct, oldProduct);
      const _diffKeys = Object.keys(diff);
      this.setState({ diffKeys: _diffKeys });
    }
  }

  setTabItems() {
    const { configureUiState } = this.props;
    if (
      configureUiState.UiAttributes.length !== 0 &&
      this.state.product.origin_products.length
    ) {
      const def = ["Common", "Documents", "Media", "History"];
      const productOrigin = map(
        this.state.product.origin_products,
        (productOrigin) => {
          return {
            slug: productOrigin.origin.toUpperCase(),
            text: productOrigin.origin,
          };
        }
      );
      let origin: any;
      const tab = map(
        configureUiState.UiAttributes[0].configuration,
        (item) => {
          map(this.state.product.origin_products, (originProduct) => {
            if (originProduct.origin === item || def.includes(item))
              return (origin = item);
          });
          return { slug: origin.toUpperCase(), text: origin };
        }
      );
      this.setState({
        tabItems: uniqBy(tab.concat(productOrigin), "slug"),
        selectedTab: tab[0],
      });
    } else {
      let data: { _id: any; name: any }[] = [];
      map(this.state.product.origin_products, (item) =>
        data.push({
          _id: item.origin,
          name: item.origin,
        })
      );
      const totalList = [
        { _id: "common", name: "Common" },
        { _id: "documents", name: "Documents" },
        { _id: "media", name: "Media" },
        ...data,
        { _id: "history", name: "History" },
      ];
      const origins = map(totalList, (item) => {
        return {
          slug: item.name.toUpperCase(),
          text: camelCaseToWords(item.name),
        };
      });
      this.setState({
        tabItems: origins,
      });
    }
  }

  updateProduct() {
    const { product } = this.state;
    this.setState(
      {
        initialProductState: Object.assign({}, product),
        updating: true,
        isReadyToUpdate: false,
      },
      () => {
        this.props.updateOptionsToState({ moveToList: true });
        this.props.onUpdate(product.skuId, product);
      }
    );
  }

  toggleEditView() {
    this.setState({
      showEditView: !this.state.showEditView,
      product: Object.assign({}, this.state.initialProductState),
    });
  }

  handleChange(field: { key: string[]; value: any }) {
    let changeProduct = cloneDeep(this.state.product);
    if (typeof field.value === "string") {
      set(changeProduct, field.key, field.value);
    } else {
      if (typeof field.value === "boolean") {
        set(changeProduct, field.key, !field.value);
      } else {
        set(changeProduct, field.key, field.value);
      }
    }

    this.setState({ product: changeProduct }, () => {
      let data = recursiveDiff(
        cloneDeep(this.state.product),
        cloneDeep(this.state.originalProduct),
        true
      );
      this.setState({
        isReadyToUpdate: !(isEmpty(data[0]) && isEmpty(data[1])),
      });
    });
  }

  goBack(): void {
    this.props.updateOptionsToState({ moveToList: true });
    this.props.history.goBack();
  }

  handleDownloadClick = (): void => {
    downloadFile(
      this.state.initialProductState,
      this.state.initialProductState.skuId,
      ".json",
      "application/json;charset=utf-8;"
    );
  };

  public handleComparison = (compareVersion: boolean) => {
    this.setState({ compareVersion });
  };

  showModal() {
    this.props.showModal(ModalsType.SingleFileModal, {
      onSave: (result: any) => {
        if (result.file) {
          const formData = new FormData();
          formData.append(result.formName, result.file);
          formData.append("skuId", this.state.product.skuId);
          this.props.onFileUpload(formData, result.fileType);
          result.file = null;
        }
        this.props.hideModal();
      },
      onClose: () => {
        this.props.hideModal();
      },
    });
  }

  getProductVersion(options: any) {
    options["skuId"] = this.props.match.params.id;
    this.props.getVersions(options);
  }

  onClickImageName = (event: any, value: any) => {
    this.props
      .getSignedUrlFromS3(
        value["fileDetails"]["fileLink"],
        true,
        undefined,
        false
      )
      .then((res: any) => {
        if (res.payload) {
          confirmAlert({
            customUI: ({ onClose }) => {
              return (
                <div className="custom-ui bg-light p-1 border rounded">
                  <div className="bg-dark border rounded custom-ui-imge-model">
                    <div className="row mb-3 align-items-center custom-ui-imge-model-cross-icon">
                      <div className="col-11">
                        <h3></h3>
                      </div>
                      <div className="col-1">
                        <button className="bg-light mx-auto" onClick={onClose}>
                          X
                        </button>
                      </div>
                    </div>
                    <Image src={res.payload.data["signedUrl"]} />
                  </div>
                </div>
              );
            },
          });
        }
      });
  };
  render(): JSX.Element {
    const {
      product,
      showEditView,
      editable,
      isProductEditable,
      compareVersion,
      isReadyToUpdate,
      tabItems,
    } = this.state;
    const { productState } = this.props;
    const key = Object.keys(this.props.productState.productsDetail)[0];

    if (compareVersion) {
      return (
        <ProductCompare
          oldProduct={this.props.productState.productsDetail[key]}
          product={this.props.productState.otherProductsDetail}
          handleComparison={this.handleComparison}
        />
      );
    } else {
      return (
        <React.Fragment>
          {product && tabItems ? (
            <React.Fragment>
              <div className="row">
                <a
                  href="/"
                  ref={(ref) => (this.downloadRef = ref)}
                  style={{ display: "none" }}
                >
                  download
                </a>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/products">Products</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      {product.name}
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
                <div>
                  <CustomeButton
                    className="btn btn-info btn-md mb-4"
                    type="button"
                    onClick={this.goBack}
                    name="Back"
                  ></CustomeButton>
                </div>
                {editable && (
                  <div>
                    <h1 className="h2">{product.ProductName}</h1>
                    <div>
                      <div className="form-group">
                        <CustomeButton
                          className="btn btn-info btn-md mr-4"
                          type="button"
                          onClick={this.handleDownloadClick}
                          name="Download"
                        ></CustomeButton>
                        {showEditView && (
                          <CustomeButton
                            className="btn btn-success btn-md margin-r-20"
                            type="button"
                            disabled={!isReadyToUpdate}
                            onClick={this.updateProduct}
                            name="Update"
                          ></CustomeButton>
                        )}
                        <CustomeButton
                          className="btn btn-info btn-md mr-4"
                          type="button"
                          disabled={!isProductEditable}
                          onClick={() => {
                            this.showModal();
                          }}
                          name="Import"
                        ></CustomeButton>
                        <CustomeButton
                          className="btn btn-info btn-md"
                          type="button"
                          disabled={!isProductEditable}
                          onClick={this.toggleEditView}
                          name={this.state.showEditView ? "Cancel" : "Revise"}
                        ></CustomeButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="row">
                <TabsComponent
                  tabItems={this.state.tabItems}
                  initialSelected={this.state.selectedTab}
                  onTabChange={(selectedTab: ITab, tab: number) =>
                    this.setState({ selectedTab, tab })
                  }
                >
                  {this.renderActiveTab(this.state.tabItems)}
                </TabsComponent>
              </div>
            </React.Fragment>
          ) : (
              (productState.loading || !tabItems) && (
                <div className="loader"></div>
              )
            )}
        </React.Fragment>
      );
    }
  }

  private getSkuDocuments = (options: any) => {
    this.props.getSkuDocuments(this.props.match.params.id, options);
  };

  private _handleLinkClick = (fileLink: string) => {
    this.props.getSignedUrlFromS3(fileLink);
  };

  private renderActiveTab(tabs: Array<ITab>): JSX.Element {
    const {
      product,
      showEditView,
      editable,
      loading,
      selectedVersionsIds,
      selectedTab,
    } = this.state;
    const {
      versionState,
      skuDocumentState,
      requestMediaPage,
      permissions,
    } = this.props;

    if (selectedTab && selectedTab.slug === "DOCUMENTS") {
      return (
        <PimSmartTable
          type="docs"
          actionOnMangeActivities={this.getSkuDocuments}
          loading={skuDocumentState.loading}
          data={skuDocumentState.documents}
          totalRecords={skuDocumentState.totalItems}
          headers={skuDocsHeader}
          filterData={true}
          isPreviewLink={true}
        />
      );
    } else if (selectedTab && selectedTab.slug === "MEDIA") {
      return (
        <PimSmartTable
          type="media"
          data={this.props.mediaPaginatorState.currentPageResults}
          totalRecords={this.props.mediaPaginatorState.totalCount || 0}
          loading={this.props.mediaPaginatorState.isFetching}
          headers={mediaHeaderForProduct}
          filterData={false}
          actionOnMangeActivities={(data: any) => {
            const { limit, page, ...other } = data;
            requestMediaPage({
              page: page,
              pageSize: limit,
              queryParams: { ...other, sku: this.props.match.params.id },
            });
          }}
          isSelectable={false}
          handleRowClick={(media: any) => {
            const role = this.props.authentication.appUser.role;
            if (permissions[role!].products.canView)
              this.props.history.push(`/media/view/${media._id}`);
            else if (permissions[role!].products.canEdit)
              this.props.history.push(`/media/edit/${media._id}`);
          }}
          onClickImageName={this.onClickImageName}
        />
      );
    } else if (selectedTab && selectedTab.slug === "HISTORY") {
      return (
        <React.Fragment>
          <ButtonGroup className="float-right">
            <Button
              outline
              color="info"
              onClick={this.handleComparision}
              disabled={
                this.state.selectedVersionsIds.length === 2 ? false : true
              }
            >
              Compare
            </Button>
          </ButtonGroup>
          <PimSmartTable
            actionOnMangeActivities={this.getProductVersion}
            loading={loading}
            data={versionState.versionList}
            totalRecords={versionState.totalData}
            headers={singleProductHeader}
            filterData={true}
            selectedIds={selectedVersionsIds}
            onSelect={this._handleOnRowSelect}
            onLinkClick={this._handleLinkClick}
            isSelectable={true}
          />
        </React.Fragment>
      );
    } else {
      return (
        <div className="col-sm-12">
          <div className="row">
            <ProductView
              product={product}
              showEditView={showEditView}
              editable={editable}
              handleChange={this.handleChange}
              tabs={this.state.tabItems}
              tab={this.state.tab}
              certLinkClick={this.certLinkClick}
              editViewForDoc={() =>
                this.props.history.push(`/supplier_docs/${product.skuId}`)
              }
            />
          </div>
        </div>
      );
    }
  }
}
const mapStateToProps = (state: any): StateProps => {
  return {
    permissions: state.authentication.permissions,
    authentication: state.authentication,
    productState: state.products,
    versionState: state.version,
    skuDocumentState: state.documentState,
    configureUiState: state.configuration,
    mediaPaginatorState: getPaginatorState(state.mediaPagination),
    s3FileState: state.s3Files,
  };
};

const mapDispatchToProps: DispatchProps = {
  getProductById: getProductById,
  onUpdate: onUpdate,
  updateOptionsToState: updateOptionsToState,
  getVersions: getVersions,
  getOtherProductByIdVersion: getOtherProductByIdVersion,
  getProductByIdVersion: getProductByIdVersion,
  showModal: showModal,
  hideModal: hideModal,
  onFileUpload: onFileUpload,
  getSignedUrlFromS3: getSignedUrlFromS3,
  getSkuDocuments: getSkuDocuments,
  getTabsRequest: getConfigurationByType,
  requestMediaPage: mediaPagination.requestPage,
};

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(SingleProduct);
