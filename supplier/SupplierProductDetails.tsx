import React, { Component } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Button } from 'reactstrap';
import { Dropdown, DropdownProps } from 'semantic-ui-react';
import { findIndex, each } from 'lodash';
import { Link } from 'react-router-dom';

import { ISupplierState } from '../../reducers';
import { getSupplierProductDetails, getEHCList, getTreatmentList, updateSKU, onUploadCertificate, getHighIngrendientList } from '../../actions';
import { ToggleButton } from '../button/ToggleButton';
import { TabsComponent, ITab } from '../tabs/Tabs';
import { SKUDetailsReduxForm, PoaoReduxForm, OrganicReduxForm, HRIReduxForm } from './SupplierProductForms';

interface StateProps {
  supplierState: ISupplierState;
}

interface DispatchProps {
  getProductById: Function;
  updateSKU: Function;
  getEHCList: Function;
  getTreatmentList: Function;
  getHighIngrendientList: Function;
  onUploadCertificate: Function;
}

interface RouteParams { skuId: string }

interface Props extends StateProps, DispatchProps, RouteComponentProps<RouteParams> { }

interface State {
  productData: any;
  activeTab: ITab;
}

class SupplierProductDetails extends Component<Props, State> {
  public constructor(props: any) {
    super(props);
    this.state = {
      productData: undefined,
      activeTab: this.tabs[0]
    }
    this.goBack = this.goBack.bind(this);
  }
  private tabs: ITab[] = [
    { slug: 'SKU_DETAILS', text: "SKU Details" }
  ];

  public componentDidMount() {
    const { skuId } = this.props.match.params;
    this.props.getProductById(skuId);
    this.props.getEHCList();
    this.props.getTreatmentList();
    this.props.getHighIngrendientList();
  }

  public componentDidUpdate(prevProps: Props): void {
    if (prevProps.supplierState.supplierProduct !== this.props.supplierState.supplierProduct) {
      this.setState({ productData: this.props.supplierState.supplierProduct });
      if (this.props.supplierState.supplierProduct && this.props.supplierState.supplierProduct.poao) {
        let index: number = findIndex(this.tabs, { slug: "POAO", text: "POAO" });
        if (index === -1) {
          this.tabs.push({ slug: "POAO", text: "POAO" });
        }
      }
    }
  }


  private goBack = (): void => {
    this.props.history.goBack();
  }

  private onChange(value: boolean, key: string): void {
    let { productData } = this.state;
    productData = { ...this.state.productData, [key]: value }
    if (key === 'poao') {
      if (value) {
        this.tabs.push({ slug: "POAO", text: "POAO" });
      } else {
        let index: number = findIndex(this.tabs, { slug: "POAO", text: "POAO" });
        if (index > -1)
          this.tabs.splice(index, 1);
        productData['POAO'] = {};
        productData['ehcList'] = [];
      }
    } else if (key === 'Organic') {
      if (value) {
        this.tabs.push({ slug: "ORGANIC", text: "ORGANIC" });
      } else {
        let index: number = findIndex(this.tabs, { slug: "ORGANIC", text: "ORGANIC" });
        if (index > -1) this.tabs.splice(index, 1);
        productData['ORGANIC'] = {};
      }
    } else if (key === 'hri') {
      if (value) {
        this.tabs.push({ slug: "HRI", text: "HRI" });
      } else {
        let index: number = findIndex(this.tabs, { slug: "HRI", text: "HRI" });
        if (index > -1) this.tabs.splice(index, 1);
        productData['HRI'] = {};
      }
    }
    if (key === 'honeyDer') {
      productData['treatmentList'] = [];
    }
    this.setState({ productData });
  }

  private onValueSelect = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps): void => {
    if (typeof data.additionLabel === 'string') {
      this.setState({
        productData: { ...this.state.productData, [data.additionLabel]: data.value }
      });
    }
  }

  render(): JSX.Element {
    const { loading, supplierAssets: { ehcList, treatmentList } } = this.props.supplierState;
    const { productData } = this.state;
    const ehcOptions: any[] = [];
    const treatmentOptions: any[] = [];
    each(ehcList, (ehcData) => {
      ehcOptions.push({ key: ehcData._id, text: ehcData.value, value: ehcData._id })
    });
    each(treatmentList, (ehcData) => {
      treatmentOptions.push({ key: ehcData._id, text: ehcData.value, value: ehcData._id })
    });
    return (
      <React.Fragment>
        {loading && <div className="loader" ></div>}
        {productData &&
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb padding-0">
                <li className="breadcrumb-item"><Link to="/supplier_products">Products</Link></li>
                <li className="breadcrumb-item active" aria-current="page">{productData.skuId}</li>
              </ol>
            </nav>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
              <Button color="info" onClick={this.goBack}>Back</Button>
            </div>
            <div className="row">
              <div className="supplier-product">
                <div className="header">
                  <div></div>
                  <div>
                    SKU Number: {productData.skuId}- {productData.DESCRIPTION}
                  </div>
                  <div>
                    v{productData.version}.0
                  </div>
                </div>
                <div className="supplier-body">
                  <div className="innner-body">
                    <div className="input-group">
                      <div className="left-group">
                        Is this SKU classed as a Product of Animal Origin? (POAO)
                      </div>
                      <ToggleButton value={productData.poao} name="poao" onChange={this.onChange.bind(this)} />
                      {
                        productData.poao &&
                        <div className="input-group">
                          <div className="left-group">
                            Select All EHC numbers that apply
                        </div>
                          <div className="input-group right-group padding-0">
                            <Dropdown
                              additionLabel={'ehcList'}
                              placeholder='Select all that apply'
                              fluid
                              search
                              multiple
                              selection
                              defaultValue={productData.ehcList}
                              options={ehcOptions}
                              onChange={this.onValueSelect}
                            />
                          </div>
                        </div>
                      }
                    </div>
                    <div className="input-group">
                      <div className="left-group">
                        Does the product have honey or honey derivatives as an ingredients?
                      </div>
                      <div className="right-group">
                        <ToggleButton value={productData.honeyDer} name="honeyDer" onChange={this.onChange.bind(this)} />
                        <div className="left-group"></div>
                        {
                          productData.honeyDer &&
                          <div className="right-group">
                            <div className="left-group bold">
                              Select Treatment Type
                            </div>
                            <div className="input-group right-group padding-0">
                              <Dropdown
                                additionLabel={'treatmentList'}
                                placeholder='Select all that apply'
                                fluid
                                search
                                multiple
                                selection
                                defaultValue={productData.treatmentList}
                                options={treatmentOptions}
                                onChange={this.onValueSelect}
                              />
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                    <div className="input-group">
                      <div className="left-group">
                        Does the product contain any high risk ingredients? (HRI)
                      </div>
                      <ToggleButton value={productData.hri} name="hri" onChange={this.onChange.bind(this)} />
                      {
                        productData.hri &&
                        <div className="input-group">
                          <div className="left-group">
                            Select all high risk ingredients that apply?
                        </div>
                          <div className="input-group right-group padding-0">
                            <Dropdown
                              placeholder='Select all that apply'
                              fluid
                              search
                              multiple
                              selection
                              // defaultValue={}
                              options={[]}
                            // onChange={this.onValueSelect}
                            />
                          </div>
                        </div>
                      }
                    </div>
                    <div className="input-group">
                      <div className="left-group">
                        Is this Product Organic?
                      </div>
                      <ToggleButton value={productData.Organic} name="Organic" onChange={this.onChange.bind(this)} />
                    </div>
                    <div className="text-center padding-30">
                      <Button color="success" onClick={this.updateSku}>Save</Button>
                    </div>
                  </div>
                  <div className="innner-body">
                    <div className="row box-border">
                      <TabsComponent tabItems={this.tabs} initialSelected={this.tabs[0]} onTabChange={(selectedTab: ITab, tab: number) => this.setState({ activeTab: selectedTab })} >
                        {this.renderActiveTab(this.tabs)}
                      </TabsComponent>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </React.Fragment>
    );
  }

  private submitTabsForm = (data: any) => {
    const { activeTab } = this.state;
    this.setState({ productData: { ...this.state.productData, [activeTab.slug]: data } }, () => {
      this.updateSku();
    });
  }

  private updateSku = () => {
    this.props.updateSKU(this.state.productData);
  }

  private renderActiveTab(tabs: Array<ITab>): JSX.Element {
    const { activeTab } = this.state;
    return (
      <div style={{ marginTop: 20 }}>
        {activeTab.slug === 'SKU_DETAILS' && this.renderSkuDetailsForm()}
        {activeTab.slug === 'POAO' && this.renderPoaoForm()}
        {activeTab.slug === 'ORGANIC' && this.renderOrganicForm()}
        {activeTab.slug === 'HRI' && this.renderHRIReduxForm()}
      </div>
    )
  }

  private submitOrganicForm = (data: any) => {
    const formData = new FormData();
    formData.append('certType', 'COI');
    formData.append('skuId', this.state.productData.skuId);
    for (let key in data) {
      formData.append(key, data[key]);
    }
    this.props.onUploadCertificate(formData)
  }

  private submitHRIForm = (data: any) => {
    const formData = new FormData();
    formData.append('skuId', this.state.productData.skuId);
    for (let key in data) {
      if (key === 'highRiskIngredients') {
        for (let i of data[key]) {
          formData.append(`${key}[]`, i);
        }
      } else {
        formData.append(key, data[key]);
      }
    }
    this.props.onUploadCertificate(formData)
  }

  private renderSkuDetailsForm = (): JSX.Element => (<SKUDetailsReduxForm onSubmit={this.submitTabsForm} />);
  private renderPoaoForm = (): JSX.Element => (<PoaoReduxForm onSubmit={this.submitTabsForm} />);
  private renderOrganicForm = (): JSX.Element => (<OrganicReduxForm onSubmit={this.submitOrganicForm} />);
  private renderHRIReduxForm = (): JSX.Element => <HRIReduxForm onSubmit={this.submitHRIForm} />
}

const mapStateToProps = (state: any): StateProps => {
  return {
    supplierState: state.supplier
  };
}

const mapDispatchToProps: DispatchProps = {
  getProductById: getSupplierProductDetails,
  updateSKU: updateSKU,
  getEHCList: getEHCList,
  getTreatmentList: getTreatmentList,
  getHighIngrendientList,
  onUploadCertificate
}

export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(SupplierProductDetails);
