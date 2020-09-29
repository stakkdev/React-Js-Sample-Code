import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';

import { ISupplierState, ApplicationState, IMasterApiCreateAction, masterSupplier, getMasterState, IMasterApiState } from '../../reducers';
import { getSuppliers } from '../../actions';
import PimSmartTable from '../smart-table/PimSmartTable';
import { supplierHeaders } from '../../pim_table_headers';
import { notify } from '../../util';
import { ALERT_TYPE } from '../../constants';

interface StateProps {
  supplierState: ISupplierState;
  supplierSkuState: IMasterApiState;
}

interface DispatchProps {
  getSuppliers: Function;
  uploadSupplierSkuMapping: IMasterApiCreateAction;
}

interface OwnProps {
  history: History;
}

type Props = DispatchProps & StateProps & OwnProps;

interface State {
}

class SupplierListComponent extends Component<Props, State> {
  private csvfileUploadRef: any;
  public constructor(props: any) {
    super(props);
    this.state = {};
    this.csvfileUploadRef = React.createRef();
  }

  public componentDidUpdate(prevsProps: Props):void {
    const { creationInProgress, error, message } = this.props.supplierSkuState;
    if(!creationInProgress && prevsProps.supplierSkuState.creationInProgress) {
      notify(error ? ALERT_TYPE.ERROR : ALERT_TYPE.SUCCESS, message || "");
    }
  }

  private uploadMapping = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const formData = new FormData();
      formData.append('csvFile', event.target.files[0]);
      this.props.uploadSupplierSkuMapping({
        body: formData
      });
      event.target.value = "";
    }
  }

  render(): JSX.Element {
    const { supplierState, getSuppliers } = this.props;
    const { creationInProgress } = this.props.supplierSkuState;
    return (
      <div>
        {creationInProgress && <div className="loader" ></div>}
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
          <h1 className="h2">Suppliers</h1>
          <input type="file" className="d-none" ref={(csvRef) => { this.csvfileUploadRef = csvRef }} accept=".csv, .xlsx, .xls" onChange={this.uploadMapping} />
          <Button outline color="danger" className="ml-3" onClick={() => { this.csvfileUploadRef.click() }}>Import SKU Mapping</Button>
        </div>
        <div className="categories">
          <PimSmartTable
            data={supplierState.suppliers}
            totalRecords={supplierState.totalItems}
            loading={supplierState.loading}
            headers={supplierHeaders}
            filterData={true}
            actionOnMangeActivities={getSuppliers}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: ApplicationState): StateProps => {
  return {
    supplierState: state.supplier,
    supplierSkuState: getMasterState(state.newSupplier.supplierSkuMap)
  };
}

const mapDispatchToProps: DispatchProps = {
  getSuppliers: getSuppliers,
  uploadSupplierSkuMapping: masterSupplier.createMaster
}

export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(mapStateToProps, mapDispatchToProps)(SupplierListComponent);
