import React, { Component } from 'react';
import { connect } from 'react-redux';
import { History } from 'history';

import SmartTable from '../smart-table/SmartTable';

import { productImportConfigHeaders } from '../smart-table/table-headers/ProductImportConfigHeaders';
import { IMasterApiState, getMasterState, ApplicationState, masterOrigin, IMasterApiListAction } from '../../reducers';

interface StateProps {
  originState: IMasterApiState; 
}

interface DispatchProps {
  requestAllOrigins: IMasterApiListAction;
}

interface OwnProps {
  history: History
}

type Props =  OwnProps & StateProps & DispatchProps;

interface State {
  _currentPage: number;
  _pageLimit: number;
}

class ListOriginComponent extends Component<Props, State> {

  public constructor(props: any) {
    super(props);
    this.state = {
      _currentPage: 0,
      _pageLimit: 100
    }
     this.props.requestAllOrigins({})
  }

  navigateToOriginDetail = (origin: any) => {
    this.props.history.push(`/product-import-config/${origin._id}`);
  }

  _handleOnPageChange(event: any, { activePage }: any) {

  }
  
  render(): JSX.Element {
    const { list, fetchingList} = this.props.originState;
    return (
      <div>
        {fetchingList && <div className="loader"></div>}
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
          <h1 className="h2"> Origin Configuration</h1>
        </div>
        <div className="apiPermissions">
         <SmartTable
            data={list}
            totalRecords={10}
            isSelectable={false}
            headers={productImportConfigHeaders}
            showFilter={false}
            initialPage={1}
            options={{
              pageSize: 100
            }}
            onRowClick={this.navigateToOriginDetail}
            onPageChange={this._handleOnPageChange}
            isSelectAll={true}
            selectedIds={[]}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: ApplicationState): StateProps => {
  return {
    originState: getMasterState(state.origins, undefined)
  };
}

const mapDispatchToProps: DispatchProps = {
  requestAllOrigins: masterOrigin.listMaster
}

export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(mapStateToProps, mapDispatchToProps)(ListOriginComponent);