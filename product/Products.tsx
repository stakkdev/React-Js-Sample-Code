import React, { Component, Suspense, lazy } from "react";
import { Button } from "reactstrap";
import { connect } from "react-redux";
import { History } from "history";
import { IProductState, ApplicationState, IAppUser } from "../../reducers";

import {
  getProducts,
  getProductById,
  onUpload,
  onMultiApprove,
  updateOptionsToState,
  errorInParsingFile,
  onFileUpload,
  hideModal,
  showModal,
  downloadProductsFromServer,
  onUploadCertificate,
  onMappingTemplateSave,
} from "../../actions";
import { userProudctExport } from "../../actions";
import ImportModal from "../general/ImportModal";
import SmartTable from "../smart-table/SmartTable";
import AdvanceFilter from "./AdvanceFilter";
import { filter } from "lodash";
import { productHeader } from "../../pim_table_headers";
import {
  PRODUCT_MODAL,
  IPRODUCT_MODAL,
  PRODUCT_STATUS,
} from "../../constants/Product";
import { ModalsType } from "../general/ModalManager";
import {
  IMPORT_FILE_TYPE,
  ROLE_EXTERNAL_USER,
  ROLE_INTERNAL_USER,
} from "../../constants";
import "../../_theme/confirm-alert.scss";
const CustomeButton = lazy(() => import("../button/CustomeButton"));

interface StateProps {
  productState: IProductState;
  appUser: IAppUser;
  permissions: any;
}

interface DispatchProps {
  getProducts: any;
  getProductById: any;
  onUpload: any;
  onFileUpload: any;
  onMultiApprove: any;
  updateOptionsToState: any;
  errorInParsingFile: any;
  hideModal: any;
  showModal: any;
  downloadProductsFromServer: any;
  onUploadCertificate: Function;
  onMappingTemplateSave: Function;
  userProudctExport: Function;
}

interface OwnProps {
  history: History;
}

type Props = StateProps & DispatchProps & OwnProps;

interface State {
  searchText: Array<string>;
  loading: boolean;
  _currentPage: number;
  _pageLimit: number;
  _showFilter: boolean;
  _clearFilter: boolean;
  _sort: { fieldName: string; value: string };
  _headerFilters: any;
  _status: string;
  advanceFilter: boolean;
  _isDynamicFilter: boolean;
  _dynamicFilters: any;
  searchCondition: string;
  tabSwitched: boolean;
  tags: Array<string>;
  tagValue: string;
  isListSelectable: boolean;
  malformedError: boolean;
  selectedProducts: Array<any>;
  selectedAll: boolean;
  showSelectAllAlert: boolean;
  exportAllProducts: boolean;
  selectedIds: Array<string>;
}

class Products extends Component<Props, State> {
  _timeout: any;
  private searchInput: any;
  public constructor(props: any) {
    super(props);
    this.state = {
      searchText: [],
      loading: true,
      _currentPage: 0,
      _pageLimit: 10,
      _showFilter: false,
      _sort: { fieldName: "", value: "" },
      _headerFilters: {},
      _status: "",
      _clearFilter: true,
      advanceFilter: false,
      _isDynamicFilter: false,
      _dynamicFilters: {},
      searchCondition: "and",
      tabSwitched: false,
      tags: [],
      tagValue: "",
      isListSelectable: false,
      malformedError: false,
      selectedProducts: [],
      selectedAll: false,
      showSelectAllAlert: false,
      exportAllProducts: false,
      selectedIds: [],
    };
    this.clickSearch = this.clickSearch.bind(this);
    this.toggleFilters = this.toggleFilters.bind(this);
    this._handlerFilter = this._handlerFilter.bind(this);
    this._handleOnPageChange = this._handleOnPageChange.bind(this);
    this._handleSort = this._handleSort.bind(this);
    this._handleRowClick = this._handleRowClick.bind(this);
    this._handleOnRowSelect = this._handleOnRowSelect.bind(this);
    this.manageUserActions = this.manageUserActions.bind(this);
    this.toggleView = this.toggleView.bind(this);
    this.toggleAdvanceFilter = this.toggleAdvanceFilter.bind(this);
    this._handleDynamicFilter = this._handleDynamicFilter.bind(this);
    this.handleCondition = this.handleCondition.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleInputKeyDown = this.handleInputKeyDown.bind(this);
    this.handleRemoveItem = this.handleRemoveItem.bind(this);
    this.handleTagsOnBlur = this.handleTagsOnBlur.bind(this);
    this.focusSearch = this.focusSearch.bind(this);
    this.toggleExportButton = this.toggleExportButton.bind(this);
    this.closeMalformed = this.closeMalformed.bind(this);
    this.handleApproves = this.handleApproves.bind(this);
    this.showModal = this.showModal.bind(this);
    this.showUploadCertModal = this.showUploadCertModal.bind(this);
    this.exportUserData = this.exportUserData.bind(this);
  }

  public componentDidMount() {
    const { productState } = this.props;
    if (Object.keys(productState.updateOptionsToState).length !== 0) {
      this.setState({ ...productState.updateOptionsToState }, () => {
        this.manageUserActions();
      });
    } else {
      this.manageUserActions();
    }
  }

  handleSearchChange = () => {
    this.setState({ searchText: this.state.tags });
  };

  handleCondition = (event: any) => {
    this.setState({ searchCondition: event.target.value });
  };

  getQueryParams(): any {
    let option: any = {
      limit: this.state._pageLimit,
      page: this.state._currentPage,
    };
    const {
      searchText,
      searchCondition,
      _sort,
      _headerFilters,
      _status,
      _dynamicFilters,
      _isDynamicFilter,
    } = this.state;
    if (searchText.length > 0) {
      option = { searchText, searchCondition, ...option };
    }
    if (_headerFilters) {
      option = { ...option, ..._headerFilters };
    }
    if (_sort.value) {
      option = { sort: _sort.fieldName, order: _sort.value, ...option };
    }
    if (_status) {
      option = { status: _status, ...option };
    }
    if (_dynamicFilters) {
      option = { ...option, ..._dynamicFilters };
    }
    if (_isDynamicFilter) {
      option = { ...option, isDynamicFilter: true };
    }
    return option;
  }

  manageUserActions() {
    let option = this.getQueryParams();
    this.props.getProducts(option);
  }
  _handleOnPageChange(event: any, { activePage }: any) {
    const { _currentPage } = this.state;
    if (activePage !== _currentPage) {
      this.setState({ _currentPage: activePage }, () => {
        this.manageUserActions();
      });
    }
  }
  _handlerFilter(data: any) {
    if (this._timeout) {
      window.clearTimeout(this._timeout);
    }
    let { _headerFilters } = this.state;
    _headerFilters = { ..._headerFilters, ...data };
    this.setState({ _currentPage: 0, _headerFilters }, () => {
      this._timeout = window.setTimeout(() => {
        this.manageUserActions();
      }, 1500);
    });
  }
  _handleSort(data: any) {
    const _sort = data;
    this.setState({ _currentPage: 0, _sort }, () => {
      this.manageUserActions();
    });
  }
  _handleRowClick(row: any) {
    const {
      searchText,
      _pageLimit,
      _sort,
      _headerFilters,
      _currentPage,
      _status,
      tags,
    } = this.state;
    this.props.updateOptionsToState({
      searchText,
      _pageLimit,
      _sort,
      _headerFilters,
      _currentPage,
      _status,
      tags,
    });
    setTimeout(() => {
      if (_status.toUpperCase() === PRODUCT_STATUS.PENDING) {
        this.props.history.push(
          `/products/${row.skuId}${isNaN(row.version) ? "" : "/" + row.version}`
        );
      } else {
        this.props.history.push(`/products/${row.skuId}`);
      }
    }, 400);
  }

  _handleOnRowSelect(row: any, isSelected: boolean) {
    let { selectedProducts, selectedIds } = this.state;
    if (this.state.exportAllProducts) {
      isSelected = !isSelected;
    }
    if (isSelected) {
      selectedProducts.push(row);
      selectedIds.push(row._id);
    } else {
      selectedProducts = filter(selectedProducts, function (product) {
        return product._id !== row._id;
      });
      selectedIds = filter(selectedIds, function (selectedId) {
        return selectedId !== row._id;
      });
    }
    this.setState({
      selectedProducts,
      selectedIds,
    });
  }
  _handleDynamicFilter(data: any) {
    let { _dynamicFilters } = this.state;
    _dynamicFilters = data;
    this.setState(
      {
        _dynamicFilters,
        _isDynamicFilter: true,
        searchText: [],
        tabSwitched: false,
      },
      () => {
        this.manageUserActions();
      }
    );
  }
  toggleFilters() {
    this.setState({
      _showFilter: !this.state._showFilter,
      searchText: [],
      _headerFilters: {},
    });
  }

  toggleView(status: string) {
    this.setState({ _status: status, _currentPage: 0 }, () => {
      let listSelectable: boolean =
        this.state._status.toLocaleUpperCase() === PRODUCT_STATUS.ACTIVE
          ? false
          : true;
      this.setState({
        loading: true,
        tabSwitched: true,
        isListSelectable: listSelectable,
      });
      this.manageUserActions();
    });
  }

  toggleAdvanceFilter() {
    this.setState({ advanceFilter: !this.state.advanceFilter }, () => {
      this.setState({ _dynamicFilters: {}, _isDynamicFilter: false }, () => {
        this.manageUserActions();
      });
    });
  }

  clickSearch() {
    this.setState(
      {
        _showFilter: false,
        _headerFilters: {},
        _currentPage: 0,
        _isDynamicFilter: false,
        tabSwitched: false,
        searchText: this.state.tags,
      },
      () => {
        this.manageUserActions();
      }
    );
  }

  handleInputChange(evt: any) {
    this.setState({
      tagValue: evt.target.value
        .replace(";", "")
        .replace(",", "")
        .replace(" ", "")
        .replace(".", ""),
    });
  }

  handleInputKeyDown(evt: any) {
    if (
      evt.keyCode === 13 ||
      evt.keyCode === 59 ||
      evt.keyCode === 188 ||
      evt.keyCode === 32 ||
      evt.keyCode === 190 ||
      evt.keyCode === 186
    ) {
      const { value } = evt.target;
      this.triggerAddOrSearch(value, true);
    }

    if (
      this.state.tags.length &&
      evt.keyCode === 8 &&
      !this.state.tagValue.length
    ) {
      this.setState(
        (state) => ({
          tags: state.tags.slice(0, state.tags.length - 1),
        }),
        () => {
          this.clickSearch();
        }
      );
    }
  }

  handleRemoveItem(index: any) {
    return () => {
      this.setState(
        (state) => ({
          tags: state.tags.filter((item, i) => i !== index),
        }),
        () => {
          this.clickSearch();
        }
      );
    };
  }
  handleTagsOnBlur(event: any) {
    const { value } = event.target;
    if (value.trim()) {
      this.setState((state) => ({
        tags: [...state.tags, value.trim()],
        tagValue: "",
      }));
    } else {
      this.setState((state) => ({
        tagValue: "",
      }));
    }
  }
  triggerAddOrSearch(value: string, tokenize: boolean = false) {
    if (value.trim()) {
      this.setState(
        (state) => ({
          tags: [...state.tags, value.trim()],
          tagValue: "",
        }),
        () => {
          if (this.state.tags.length > 0) {
            this.clickSearch();
          }
        }
      );
    } else {
      if (!tokenize) {
        this.setState((state) => ({
          tagValue: "",
        }));
        this.clickSearch();
      }
    }
  }

  toggleExportButton() {
    this.props.showModal(ModalsType.ExportProducts, {
      onSave: (result: any) => {},
      onClose: () => {
        this.props.hideModal();
      },
      showOrigin: true,
    });
  }

  closeMalformed() {
    this.setState({ malformedError: false });
  }

  focusSearch() {
    this.searchInput.focus();
  }

  handleApproves() {
    const productObjects = this.state.selectedProducts;
    if (productObjects.length) {
      this.props.onMultiApprove(productObjects);
    }
  }

  handleSelectAll = () => {
    let updateState: any = {
      selectedAll: !this.state.selectedAll,
    };
    if (this.props.productState.totalItems > 10) {
      updateState.showSelectAllAlert = !this.state.selectedAll;
    } else {
      updateState.selectedProducts = [...this.props.productState.data];
      updateState.showSelectAllAlert = false;
    }
    this.setState(updateState);
  };

  handleClose = () => {
    this.setState({ showSelectAllAlert: false });
  };

  handleSelectAllProducts = () => {
    this.setState({ exportAllProducts: true, selectedProducts: [] });
    this.handleClose();
  };

  handlePageSelectProducts = () => {
    this.setState({
      selectedProducts: this.props.productState.data,
    });
    this.handleClose();
  };

  shouldComponentUpdate(nextprops: Props, nextState: State): boolean {
    if (this.props.productState.loading !== nextprops.productState.loading) {
      this.setState({
        loading: nextprops.productState.loading,
        malformedError: nextprops.productState.malformedError,
      });
    }
    if (
      this.props.productState.productUpload !==
      nextprops.productState.productUpload
    ) {
      this.setState({
        loading: nextprops.productState.loading,
      });
      if (this.props.productState.productUpload) {
        this.manageUserActions();
      }
    }
    if (
      this.props.productState.totalItems !==
        nextprops.productState.totalItems &&
      nextprops.productState.totalItems === 1
    ) {
      if (
        !nextState._showFilter &&
        !this.state.tabSwitched &&
        !nextprops.productState.updateOptionsToState.moveToList
      )
        this._handleRowClick(nextprops.productState.data[0]);
    }
    if (
      this.props.productState.updateOptionsToState.moveToList &&
      this.props.productState.totalItems === 0 &&
      this.state._status.toUpperCase() === PRODUCT_STATUS.PENDING
    ) {
      this.props.updateOptionsToState({ moveToList: false, _status: "ACTIVE" });
      this.props.productState.updateOptionsToState =
        nextprops.productState.updateOptionsToState;
      this.toggleView("ACTIVE");
    }
    if (
      this.props.productState.productMultiApproving &&
      this.props.productState.productMultiApproving !==
        nextprops.productState.productMultiApproving
    ) {
      this.manageUserActions();
      this.setState({
        isListSelectable: false,
        selectedProducts: [],
      });
    }
    return true;
  }

  showModal() {
    let fileName = "";
    let lastModified = 0;
    let origin = "";
    this.props.showModal(ModalsType.ImportProduct, {
      onSave: (result: any) => {
        if (result.fileType === IMPORT_FILE_TYPE.CSV) {
          fileName = result.file.name;
          lastModified = result.file.lastModified;
          origin = result.selectedOrigin;
          this.props.showModal(ModalsType.ImportProductCSV, {
            file: result.file,
            onSave: (result: any) => {
              let file = new File([JSON.stringify(result)], fileName, {
                type: "application/json",
                lastModified: lastModified,
              });
              const formData = new FormData();
              formData.append("origin", origin);
              formData.append("parsedCSV", file);
              this.props.onFileUpload(formData, "parsedcsv");
              result.file = null;
              this.props.hideModal();
            },
            onClose: () => {
              this.props.hideModal();
            },
            onMappingSave: (result: any) => {
              var mappingData = { name: result.name, mapping: result.mapping };
              this.props.onMappingTemplateSave(mappingData);
            },
          });
        } else {
          if (result.file && result.selectedOrigin) {
            const formData = new FormData();
            formData.append("origin", result.selectedOrigin);
            formData.append("isZipFile", result.isZipFile);
            formData.append(result.formName, result.file);
            this.props.onFileUpload(formData, result.fileType);
            result.file = null;
          }
          this.props.hideModal();
        }
      },
      onClose: () => {
        this.props.hideModal();
      },
      showOrigin: true,
    });
  }

  showUploadCertModal() {
    this.props.showModal(ModalsType.UploadCertificateModal, {
      onSave: (result: any) => {
        let files = result.files;
        const formData = new FormData();
        formData.append("certType", result.selectedCertType);
        if (result.EHC) formData.append("EHC", result.EHC);
        for (const file of files) {
          formData.append("documentFile", file);
        }
        this.props.onUploadCertificate(formData);
        result.files = null;
        this.props.hideModal();
      },
      onClose: () => {
        this.props.hideModal();
      },
    });
  }

  exportUserData() {
    this.props.userProudctExport();
  }

  render(): JSX.Element {
    const { productState, appUser, permissions } = this.props;
    const {
      searchText,
      loading,
      advanceFilter,
      isListSelectable,
      malformedError,
      _status,
      _currentPage,
      _pageLimit,
      selectedAll,
      showSelectAllAlert,
      selectedIds,
    } = this.state;
    let PRODUCT_MODAL_DATA: IPRODUCT_MODAL = { ...PRODUCT_MODAL };
    if (productState.totalItems !== 0) {
      PRODUCT_MODAL_DATA = {
        ...PRODUCT_MODAL,
        BODY: PRODUCT_MODAL.BODY.replace(
          "{{selectedProductsOnPage}}",
          productState.data.length.toString()
        ).replace("{{allProducts}}", productState.totalItems.toString()),
      };
    }

    return (
      <React.Fragment>
        {showSelectAllAlert && (
          <ImportModal
            body={PRODUCT_MODAL_DATA.BODY}
            buttons={PRODUCT_MODAL_DATA.BUTTONS}
            handleButton={[
              this.handleSelectAllProducts,
              this.handlePageSelectProducts,
            ]}
          />
        )}
        {loading && <div className="loader"></div>}
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button
              className={
                "btn btn-link nav-link " +
                (this.state._status.toUpperCase() !== PRODUCT_STATUS.PENDING
                  ? "active"
                  : "")
              }
              data-toggle="tab"
              onClick={() => this.toggleView("ACTIVE")}
            >
              Active
            </button>
          </li>
          {permissions[appUser.role!].products.canEdit && (
            <li className="nav-item">
              <button
                className={
                  "btn btn-link nav-link " +
                  (this.state._status.toUpperCase() === PRODUCT_STATUS.PENDING
                    ? "active"
                    : "")
                }
                data-toggle="tab"
                onClick={() => this.toggleView("PENDING")}
              >
                Pending
              </button>
            </li>
          )}
        </ul>
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
          <h2>
            Products{" "}
            {this.state._status.toUpperCase() === PRODUCT_STATUS.PENDING
              ? "(" + this.state._status.toLocaleUpperCase() + ")"
              : ""}
          </h2>
          {permissions[appUser.role!].products.canEdit &&
            _status.toUpperCase() !== PRODUCT_STATUS.PENDING && (
              <div>
                <Button
                  outline
                  color="danger"
                  className="btn-r-small-l btn"
                  onClick={this.showUploadCertModal}
                >
                  Upload Documents
                </Button>
              </div>
            )}
        </div>
        {malformedError && (
          <div className="row">
            <div className="col-sm-12">
              <span
                className="float-right"
                onClick={this.closeMalformed}
                style={{
                  cursor: "pointer",
                  fontWeight: 500,
                  textDecoration: "underline",
                }}
              >
                Close
              </span>
              <p>
                Download a json format file as an example for{" "}
                <a href="/api/products/single_product">Single</a> Product or for{" "}
                <a href="/api/products/multiple_product">Multiple</a> Products
              </p>
            </div>
          </div>
        )}
        <div className="form-inline mt-2 mt-md-0 mb-3 search-container">
          <ul
            className="tagsContainer my-2 my-sm-0 mr-3"
            onClick={this.focusSearch}
          >
            {this.state.tags.map((item, i) => (
              <li key={i} className="tags">
                {item.split("").map((word, n) => {
                  if (word === " ") {
                    return (
                      <React.Fragment key={word + "_" + n}>
                        &nbsp;
                      </React.Fragment>
                    );
                  } else return word;
                })}
                <span onClick={this.handleRemoveItem(i)}>&nbsp;×</span>
              </li>
            ))}
            <input
              className="searchInput"
              ref={(searchInput) => {
                this.searchInput = searchInput;
              }}
              value={this.state.tagValue}
              onChange={this.handleInputChange}
              onKeyDown={this.handleInputKeyDown}
              onBlur={this.handleTagsOnBlur}
              placeholder="Add a tag"
            />
          </ul>
          <select
            className="condition-select mr-3"
            onChange={this.handleCondition}
          >
            <option value="and">AND</option>
            <option value="or">OR</option>
          </select>
          <Suspense fallback="">
            <CustomeButton
              disabled={loading || advanceFilter}
              className="btn btn-outline-info my-2 my-sm-0 mr-3"
              type="button"
              onClick={this.clickSearch}
              name={
                loading && searchText.length > 0 ? "Searching..." : "Search"
              }
            />
            <CustomeButton
              disabled={loading || advanceFilter}
              className="btn btn-outline-info my-2 my-sm-0 mr-3"
              type="button"
              onClick={this.toggleFilters}
              name="Filter"
            />
            <CustomeButton
              disabled={loading}
              className="btn btn-outline-info my-2 mr-3"
              type="button"
              onClick={this.toggleAdvanceFilter}
              name="Advance Filter"
            />
          </Suspense>
          {permissions[appUser.role!].products.canEdit && (
            <React.Fragment>
              {_status.toUpperCase() !== PRODUCT_STATUS.PENDING && (
                <Button
                  outline
                  color="danger"
                  className="btn-r-small-l btn"
                  disabled={loading || productState.productUpload}
                  onClick={() => {
                    this.showModal();
                  }}
                >
                  {productState.productUpload ? "Uploading..." : "Import"}
                </Button>
              )}
              {_status.toUpperCase() === PRODUCT_STATUS.PENDING && (
                <Button
                  outline
                  color="success"
                  className="btn-r-small-l btn"
                  disabled={loading || productState.productUpload}
                  onClick={this.handleApproves}
                >
                  {"Approve"}
                </Button>
              )}
              <Button
                outline
                color="info"
                className="ml-3 hidden"
                onClick={this.toggleExportButton}
              >
                Export
              </Button>
            </React.Fragment>
          )}
          {productState.totalItems > 0 && appUser.role === ROLE_INTERNAL_USER && (
            <Button
              outline
              color="info"
              className="ml-3 hidden"
              onClick={this.toggleExportButton}
            >
              Export
            </Button>
          )}
          {productState.totalItems > 0 && appUser.role === ROLE_EXTERNAL_USER && (
            <Button
              outline
              color="info"
              className="ml-3 hidden"
              onClick={this.exportUserData}
            >
              Export
            </Button>
          )}
        </div>
        {advanceFilter && (
          <AdvanceFilter
            productData={productState.data[0] || []}
            onDynamicSearch={this._handleDynamicFilter}
          />
        )}
        {
          <div className="float-right itemscount">
            Showing{" "}
            {_currentPage === 0
              ? productState.totalItems === 0
                ? 0
                : _currentPage + 1
              : _currentPage * _pageLimit + 1}{" "}
            to{" "}
            {(_currentPage + 1) * _pageLimit < productState.totalItems
              ? (_currentPage + 1) * _pageLimit
              : productState.totalItems}{" "}
            of {productState.totalItems}
          </div>
        }
        <div className="products">
          <SmartTable
            data={productState.data}
            totalRecords={productState.totalItems}
            isSelectable={isListSelectable}
            onRowSelect={this._handleOnRowSelect}
            headers={productHeader}
            headerFilters={this.state._headerFilters}
            showFilter={this.state._showFilter}
            initialPage={this.state._currentPage}
            options={{
              pageSize: this.state._pageLimit,
            }}
            onSort={this._handleSort}
            onRowClick={this._handleRowClick}
            onFilterChange={this._handlerFilter}
            onPageChange={this._handleOnPageChange}
            isSelectAll={true}
            selectedAll={selectedAll}
            selectedIds={selectedIds}
            handleSelectAll={this.handleSelectAll}
          />
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: ApplicationState): StateProps => {
  return {
    permissions: state.authentication.permissions,
    productState: state.products,
    appUser: state.authentication.appUser,
  };
};

const mapDispatchToProps: DispatchProps = {
  getProducts: getProducts,
  getProductById: getProductById,
  onUpload: onUpload,
  onFileUpload: onFileUpload,
  onMultiApprove: onMultiApprove,
  updateOptionsToState: updateOptionsToState,
  errorInParsingFile: errorInParsingFile,
  showModal: showModal,
  hideModal: hideModal,
  downloadProductsFromServer: downloadProductsFromServer,
  onUploadCertificate: onUploadCertificate,
  onMappingTemplateSave: onMappingTemplateSave,
  userProudctExport: userProudctExport,
};

export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps
)(Products);
