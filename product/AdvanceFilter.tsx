import React, { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { camelCaseToWords } from "../../_helpers/helper";
import CustomeButton from "../button/CustomeButton";
import CustomeDropDown from "../dropdown/CustomDropDown";

interface Props {
  productData: any;
  onDynamicSearch: Function;
}

interface State {
  productKeys: Array<string>;
  productKeyValue: any;
  dropDownValue: string;
  selectedKeys: any;
  booleanFieldValue: any;
}

export default class AdvanceFilter extends Component<Props, State>  {

  constructor(props: Props) {
    super(props);
    this.state = {
      productKeys: [],
      productKeyValue: {},
      selectedKeys: null,
      dropDownValue: '',
      booleanFieldValue: {}
    }
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleAddClick = this.handleAddClick.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.advanceFieldsSearch = this.advanceFieldsSearch.bind(this);
    this.handleSwitchChange = this.handleSwitchChange.bind(this);
    this.handleClearClick = this.handleClearClick.bind(this);
  }

  componentWillMount() {
    const { productData } = this.props
    const hiddedFileds = ["_id", "__v", "modified", "slug", "grouping", "isCategoryInClearance", "description", "origin_products"];
    const prodKeys = Object.keys(productData)
    const filteredKeys = prodKeys.filter(element => !hiddedFileds.includes(element))
    const fieldsKeyValuePair = this.fieldWithDataType(filteredKeys)
    this.setState({ productKeys: filteredKeys, productKeyValue: fieldsKeyValuePair })
  }

  fieldWithDataType(filteredLabels: any) {
    const booleanFields = ["isCategoryInClearance", "isEligibleForLoyalty", "isEligibleForSubscription", "isEligibleToExport",
      "isImported", "isMasterSku", "isProductInClearance", "isSearchable"];
    const numberFields = ["maximumSaleAllowed", "potency", "size", "unitQuantity"]
    let labelWithType: any = {};
    filteredLabels.filter((label: string) => {
      if (booleanFields.includes(label))
        labelWithType[label] = 'boolean'
      else if (numberFields.includes(label))
        labelWithType[label] = 'number'
      else
        labelWithType[label] = 'string'
      return labelWithType;
    });
  }

  handleSelectChange = (eve: any) => {
    this.setState({ dropDownValue: eve.target.value })
  }

  handleAddClick() {
    let selectedValues: Array<string> = this.state.selectedKeys || [];
    if (this.state.dropDownValue !== '') {
      selectedValues.push(this.state.dropDownValue)
      this.setState({ selectedKeys: selectedValues }, () => {
        this.setState({ dropDownValue: '' })
      })
    }
  }

  handleRemove(event: any) {
    let allElements: Array<string> = this.state.selectedKeys
    const field = event.target.name || event.target.parentElement.name || event.target.parentElement.parentElement.name;
    const filteredElements = allElements.filter(element => element !== field)
    this.setState({ selectedKeys: filteredElements })
  }

  handleSwitchChange(event: any): any {
    let mappedData: any = {}
    mappedData[event.target.name] = !this.state.booleanFieldValue[event.target.name]
    this.setState({ booleanFieldValue: mappedData })
    return this.state.booleanFieldValue
  }

  handleClearClick() {
    this.setState({
      selectedKeys: []
    });
  }

  advanceFieldsSearch() {
    const filledLabels = Object.keys(this.refs);
    const referencedElements: any = this.refs;
    let searchKeyValue: any = filledLabels.map((element: any) => {
      return searchKeyValue[element] = referencedElements[element].value
    });
    this.props.onDynamicSearch(searchKeyValue);
  }

  render(): JSX.Element {
    const { productKeys, selectedKeys, productKeyValue } = this.state
    return (
      <React.Fragment>
        <hr style={{ borderTop: '2px dotted rgba(0, 0, 0, 0.3)' }} />
        {productKeys.length &&
          <div className="form-inline mt-2 mt-md-0 mb-3">
            <CustomeDropDown className="fieldDropDown form-control mr-3" onChange={this.handleSelectChange} productlist={productKeys} selectedkeys={selectedKeys}></CustomeDropDown>
            <CustomeButton className="btn btn-outline-info mr-3" onClick={this.handleAddClick} type="button" name="Add"></CustomeButton>
            <CustomeButton className="btn btn-outline-info mr-3" onClick={this.handleClearClick} type="button" name="Clear"></CustomeButton>
            <CustomeButton className="btn btn-outline-success my-sm-0 ml-auto" onClick={this.advanceFieldsSearch} type="button" name="Search"></CustomeButton>
          </div>
        }

        {selectedKeys &&
          <div className="row">
            {selectedKeys.map((selectedKey: string, index: any) => {
              return (
                <div className="col-sm-6" key={index}>
                  <div className="form-group row">
                    <label className="col-sm-6 col-form-label font-weight-500">{camelCaseToWords(selectedKey)}</label>
                    <div className="col-sm-4">
                      {productKeyValue[selectedKey] === 'boolean' &&
                        <label className="switch">
                          <input type="checkbox" name={selectedKey} ref={selectedKey} value={this.state.booleanFieldValue[selectedKey] || false} onClick={this.handleSwitchChange} />
                          <span className="slider round"></span>
                        </label>
                      }
                      {productKeyValue[selectedKey] === 'number' &&
                        <input type="number" className="form-control" name={selectedKey} ref={selectedKey} />
                      }
                      {productKeyValue[selectedKey] === 'string' &&
                        <input type="text" className="form-control" name={selectedKey} ref={selectedKey} />
                      }
                    </div>
                    <div className="col-sm-2">
                      <button className="btn btn-outline-danger" name={selectedKey} onClick={e => this.handleRemove(e)} >
                        <FontAwesomeIcon icon="minus-circle" className="iconClass" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        }
      </React.Fragment>
    );
  }
}