import React from 'react';
import { connect } from 'react-redux';
import { History } from 'history';
import { reduxForm, Field, InjectedFormProps, FormInstance } from 'redux-form';
import { TextArea } from 'semantic-ui-react';
import CustomeButton from '../button/CustomeButton';
import { IOptionType } from "../../constants";
import { ApplicationState, getMasterState, IMasterApiState, IMasterApiRequestAction, IMasterApiUpdateAction } from '../../reducers';
import { masterOrigin } from '../../store/createMasterStore';
import { convertValuesToOption, convertOptionsToValue } from '../../util';
import { FormInputToggle } from '../FormInputs';

interface IOriginCongigurationForm {
  attributes: Array<IOptionType>;
  brandPath: Array<IOptionType>;
  skuPattern: Array<IOptionType>;
  shouldNameUpdate: boolean,
  shouldBrandUpdate: boolean,
  shouldSupplierInfoUpdate: boolean
}


interface StateProps {
  originConfigurationState: IMasterApiState;
  initialValues: IOriginCongigurationForm;
  skuOptions: Array<IOptionType>;
  brandPathOptions: Array<IOptionType>;
  attributesOptions: Array<IOptionType>;
}

interface DispatchProps {
  requestOrigin: IMasterApiRequestAction;
  updateOrigin: IMasterApiUpdateAction;
}

interface OwnProps {
  history: History;
  match: any;
}

type Props = OwnProps & StateProps & DispatchProps;

interface State {
  message: string | undefined;
  error: boolean | undefined;
}

class OriginConfiguration extends React.Component<Props & InjectedFormProps<IOriginCongigurationForm, Props> &
  FormInstance<IOriginCongigurationForm, Props, string>, State>  {

  public constructor(props: any) {
    super(props);
    this.state = {
      message: undefined,
      error: undefined
    }
    const { id } = props.match.params;

    this.props.requestOrigin({
      urlParams: {
        originId: id
      }
    });
  }

  goBack = () => {
    this.props.history.goBack();
  }

  showMessage = (message: string, error: boolean) => {
    this.setState({ message, error })
    setTimeout(() => {
      this.setState({ message: undefined, error: undefined })
    }, 3000)
  }

  public componentDidUpdate(prevsProps: Props): void {
    const { updatingInProgress, error, message } = this.props.originConfigurationState;
    if (!updatingInProgress && prevsProps.originConfigurationState.updatingInProgress) {
      this.showMessage(message!, error);
    }

  }


  render(): JSX.Element {
    const { data, updatingInProgress, fetching } = this.props.originConfigurationState;
    const { error, message } = this.state;

    return (
      <div className="container mb-5">
        {
          message && <React.Fragment>
            {error && <div className='alert alert-danger alert-dismissible'>
              <div><span><strong>Error:</strong> {message}</span></div>
            </div>}{
              !error && <div className='alert alert-success alert-dismissible'>
                <div><span><strong>Success:</strong> {message}</span></div>
              </div>
            }
          </React.Fragment>
        }
        {(updatingInProgress || fetching) && <div className="loader" ></div>}

        <div className="row">
          <div className="col-sm-11">
            <h1 className="h2">Origin Configuration: {data ? data.name : ""}</h1>
          </div>
          <div className="col-sm-1">
            <CustomeButton className="btn btn-primary btn-md mb-4" type="button" onClick={this.goBack} name="Back"></CustomeButton>
          </div>
        </div>
        <div className="col-md-12 col-sm-12 form-group">
          <Field
            name="attributes"
            placeholder={"Enter attributes here comma (,) separated"}
            label={"Enter the attributes name to ignore from product import (comma separeted):"}
            component={({ input, options, meta, label, prefix, ...props }: any) => {
              return (<div className="form-group">
                <label className="bold" >{label}</label>
                <TextArea className="form-control" value={input.value && input.value.join(",")}  {...props} onChange={(e, d: any) => input.onChange(d.value.split(","))} />
                {meta.error && meta.touched && <span className="text-danger">{meta.error}</span>}
              </div>)
            }}
          />
          <div className="col-sm-6 form-group padding-0 d-flex">
            <label className="bold col-sm-6 padding-0">Should Name Update?</label>
            <Field name="shouldNameUpdate" isEditable={true} component={FormInputToggle} />
          </div>
          <div className="col-sm-6 form-group padding-0 d-flex">
            <label className="bold col-sm-6 padding-0">Should Brand Update?</label>
            <Field name="shouldBrandUpdate" isEditable={true} component={FormInputToggle} />
          </div>
          <div className="col-sm-6 form-group padding-0 d-flex">
            <label className="bold col-sm-6 padding-0">Should Supplier Info Update?</label>
            <Field name="shouldSupplierInfoUpdate" isEditable={true} component={FormInputToggle} />
          </div>
        </div>
        <div className="col-md-12 col-sm-6">
          <div className="form-group  float-right">
            <div style={{ marginBottom: '2rem' }}></div>
            <div>
              <CustomeButton type="submit" className="btn btn-info btn-md" onClick={() => this.props.submit()} name="Save Configuration" ></CustomeButton>
            </div>
          </div>
        </div>
      </div>)
  }
}


const OriginConfigurationForm = reduxForm({
  form: "OriginConfigurationForm",
  onSubmit: (data: IOriginCongigurationForm, dispatch: any, props: Props) => {
    props.updateOrigin({
      urlParams: {
        originId: props.match.params.id
      },
      body: {
        ...props.originConfigurationState.data,
        productConfiguration: {
          ignoreKeysForDiff: data.attributes,
          pattrenMatchForSKU: convertOptionsToValue(data.skuPattern),
          pattrenMatchForBrandName: convertOptionsToValue(data.brandPath),
          shouldNameUpdate: data.shouldNameUpdate,
          shouldBrandUpdate: data.shouldBrandUpdate,
          shouldSupplierInfoUpdate: data.shouldSupplierInfoUpdate
        }
      }
    })
  },
  destroyOnUnmount: true,
  enableReinitialize: true,
  validate: (values: any) => {
    const errors: any = {}
    if (!values.attributes) {
      errors.attributes = "Enter valid attributes";
    }
    return errors;
  }
})(OriginConfiguration)

const mapStateToProps = (state: ApplicationState): StateProps => {
  const originConfigurationState = getMasterState(state.origins, undefined);
  const data = originConfigurationState.data;
  let originResultSet: any = {
    brandPathOptions: [],
    skuOptions: [],
    initialValues: undefined
  }
  if (data && data.productConfiguration) {
    const attributes = data.productConfiguration.ignoreKeysForDiff;
    const skuPattern = convertValuesToOption(data.productConfiguration.pattrenMatchForSKU || []);
    const brandPath = convertValuesToOption(data.productConfiguration.pattrenMatchForBrandName || []);
    originResultSet = {
      brandPathOptions: brandPath,
      skuOptions: skuPattern,
      attributesOptions: attributes,
      initialValues: data && data.productConfiguration && {
        attributes,
        brandPath,
        skuPattern,
        shouldNameUpdate: data.productConfiguration.shouldNameUpdate,
        shouldBrandUpdate: data.productConfiguration.shouldBrandUpdate,
        shouldSupplierInfoUpdate: data.productConfiguration.shouldSupplierInfoUpdate
      }
    }
  }
  return {
    originConfigurationState,
    ...originResultSet
  };
}

const mapDispatchToProps: DispatchProps = {
  requestOrigin: masterOrigin.requestMaster,
  updateOrigin: masterOrigin.updateMaster
}

export default connect<StateProps, DispatchProps, OwnProps, ApplicationState>(mapStateToProps, mapDispatchToProps)(OriginConfigurationForm);
