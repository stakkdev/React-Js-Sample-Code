import React, { Component } from 'react';
import { connect } from 'react-redux';
import { History } from 'history';

import { showModal, hideModal, showMessage, getSupplierProducts } from '../../actions';
import PimSmartTable from '../smart-table/PimSmartTable';
import { supplierProductHeader } from '../../pim_table_headers';
import { ISupplierState } from '../../reducers';

interface StateProps {
  supplierState: ISupplierState;
}

interface DispatchProps {
  getSupplierProducts: Function;
  showModal: Function;
  hideModal: Function;
  showMessage: Function;
}

interface Props extends StateProps, DispatchProps {
  history: History
}

interface State {
}

class SupplierProductsComponent extends Component<Props, State> {
  public constructor(props: any) {
    super(props);
    this.state = {
    };
    this.handleRowClick = this.handleRowClick.bind(this);
  }

  public componentDidMount() {
  }

  shouldComponentUpdate(nextprops: Props): boolean {
    return true;
  }

  handleRowClick = (row: any) => {
    setTimeout(() => {
      this.props.history.push(`/supplier_products/${row.skuId}`);
    }, 400);
  }

  render(): JSX.Element {
    const { supplierState, getSupplierProducts } = this.props;
    return (
      <div>
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
          <h1 className="h2">Supplier Products</h1>
        </div>
        <div className="categories">
          <PimSmartTable
            data={supplierState.suppliers}
            totalRecords={supplierState.totalItems}
            loading={supplierState.loading}
            headers={supplierProductHeader}
            filterData={true}
            actionOnMangeActivities={getSupplierProducts}
            isSelectable={false}
            handleRowClick={this.handleRowClick}
          />
        </div>
      </div>
    );
  }
}


const mapStateToProps = (state: any): StateProps => {
  return {
    supplierState: state.supplier
  };
}

const mapDispatchToProps: DispatchProps = {
  getSupplierProducts: getSupplierProducts,
  showModal: showModal,
  hideModal: hideModal,
  showMessage: showMessage
}

export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(SupplierProductsComponent);
