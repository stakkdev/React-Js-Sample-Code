import React, { Component } from "react";
import { connect } from "react-redux";

import { IDocumentState, IAuthenticationState } from "../../reducers";
import {
  showModal,
  hideModal,
  onUploadSupplierDocs,
  getSupplierDocuments,
} from "../../actions";
import PimSmartTable from "../smart-table/PimSmartTable";
import { Button, ButtonGroup } from "reactstrap";
import { ModalsType } from "../general/ModalManager";
import { supplierDocsHeader } from "../../pim_table_headers";

interface StateProps {
  supplierDocState: IDocumentState;
  authentication: IAuthenticationState;
}

interface DispatchProps {
  getDocuments: Function;
  showModal: Function;
  hideModal: Function;
  onUploadSupplierDocs: Function;
}

interface Props extends StateProps, DispatchProps {}

interface State {}

class SupplierDocListComponent extends Component<Props, State> {
  public constructor(props: any) {
    super(props);
    this.state = {};
    this.showUploadCertModal = this.showUploadCertModal.bind(this);
  }

  shouldComponentUpdate(nextprops: Props): boolean {
    return (
      nextprops.supplierDocState.modifiedTime !==
      this.props.supplierDocState.modifiedTime
    );
  }

  render(): JSX.Element {
    const {
      supplierDocState,
      getDocuments,
      authentication: {
        permissions,
        appUser: { role },
      },
    } = this.props;
    return (
      <div>
        {supplierDocState.loading && <div className="loader"></div>}
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3">
          <h1 className="h2">Docs</h1>
          {permissions[role!].document.canEdit && (
            <ButtonGroup className="float-right">
              <Button outline color="danger" onClick={this.showUploadCertModal}>
                Import
              </Button>
            </ButtonGroup>
          )}
        </div>
        <div className="categories">
          <PimSmartTable
            data={supplierDocState.documents}
            totalRecords={supplierDocState.totalItems}
            loading={supplierDocState.loading}
            headers={supplierDocsHeader}
            filterData={true}
            actionOnMangeActivities={getDocuments}
            isSelectable={false}
          />
        </div>
      </div>
    );
  }

  showUploadCertModal() {
    this.props.showModal(ModalsType.UploadCertificateModal, {
      onSave: (result: any) => {
        let files = result.files;
        const formData = new FormData();
        formData.append("certType", result.selectedCertType);
        for (const file of files) {
          formData.append("documentFile", file);
        }
        this.props.onUploadSupplierDocs(formData);
        result.files = null;
        this.props.hideModal();
      },
      onClose: () => {
        this.props.hideModal();
      },
    });
  }
}

const mapStateToProps = (state: any): StateProps => {
  return {
    supplierDocState: state.documentState,
    authentication: state.authentication,
  };
};

const mapDispatchToProps: DispatchProps = {
  getDocuments: getSupplierDocuments,
  showModal: showModal,
  hideModal: hideModal,
  onUploadSupplierDocs: onUploadSupplierDocs,
};

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(SupplierDocListComponent);
