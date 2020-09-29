import React, { useRef } from 'react'
import { Field, reduxForm, formValueSelector } from 'redux-form';
import { Button } from 'reactstrap';
import { Dropdown } from 'semantic-ui-react'
import { ReduxValidation } from '../../_helpers/reduxFormHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';

interface ISubmitFormProps {
  handleSubmit(event: React.FormEvent<HTMLFormElement>): void;
}

const renderField = ({ input, label, placeholder, type, meta: { touched, error, warning } }: any) => (
  <div>
    <label className="left-group bold">{label}</label>
    <div>
      <input {...input} placeholder={placeholder} type={type} className="form-control" />
      {touched && ((error && <span className="form-error">{error}</span>) || (warning && <span>{warning}</span>))}
    </div>
  </div>
)

const RenderFile = ({ input, label, placeholder, type, meta: { touched, error, warning } }: any) => {
  let attachmentRef: any = useRef()
  return (
    <>
      <input type="file"
        className="d-none"
        onChange={(event: any) => input.onChange(event && event.target.files[0])}
        ref={ref => attachmentRef = ref}
        accept=".pdf" />
      <div className="d-inline cursor"
        onClick={() => attachmentRef.click()}>
        <span className="fa-2x cursor" >
          <FontAwesomeIcon color="red" icon="file-pdf" size="xs" className="iconClass" />
        </span> Attach file
      </div>
      <div>
        {touched && ((error && <span className="form-error">{error}</span>) || (warning && <span>{warning}</span>))}
      </div>
    </>
  )
}

const maxLength10 = ReduxValidation.maxLength(10);
const maxLength4 = ReduxValidation.maxLength(4);
const minLength10 = ReduxValidation.minLength(10);
const minLength4 = ReduxValidation.minLength(4);

let SKUDetailsForm = (props: ISubmitFormProps): JSX.Element => {
  const { handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit}>
      <Field name="commodityCode" type="text" component={renderField} label="Commodity Code (Must be 10 digits)" validate={[minLength10, maxLength10]} />
      <Field name="meursingCode" type="text" component={renderField} label="Meursing Code (Where applicable requires be 4 digits)" validate={[minLength4, maxLength4]} />
      <Field name="economicSource" type="text" component={renderField} label="Economic Source Of Origin" />
      <div className="text-center padding-30">
        <Button type="submit" color="success padding-top-5">Save</Button>
      </div>
    </form>
  )
}

let PoaoForm = (props: ISubmitFormProps): JSX.Element => {
  const { handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit}>
      <div className="detail field padding-top-5">
        <div className="left-group bold">Letter of Declaration - Please submit a letter of Declaration for each relevant Product Category for this Sku</div>
        <div className="box-border">
          <div className="row">
            <div className="col-sm-6">
              <label className="bold">* New Letter of Declaration</label>
            </div>
            <div className="col-sm-6">
              <label className="left-group bold">* Category</label>
              <Dropdown
                placeholder='Select Category'
                fluid
                search
                selection
                options={[]}
              />
              <div className="padding-15 bold">
                LOD template for the your selected EHC is not available please use this template to create your own , on company headed paper and singed by Quality team.
              </div>
            </div>
          </div>
          <div className="text-center padding-15">
            <Button color="success" type="submit">Upload</Button>
          </div>
        </div>
        <div className="padding-15">
          <div className="row">
            <label className="bold">Submitted Letter of Declaration</label>
          </div>
          <div className="row">
            <textarea style={{ width: "100%" }} rows={6} />
          </div>
        </div>
      </div>
    </form>
  )
}

const OrganicForm = (props: any): JSX.Element => {
  const { handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-6">
          <div className="detail field">
            <label htmlFor="">* Organic Certificate</label>
            <div className="col-12">
              <div>
                {!props.documentFile && <p style={{ color: "#969292", fontSize: "12px" }}>There is nothing attached</p>}
                {props.documentFile && <p style={{ color: "#969292", fontSize: "12px" }}>{props.documentFile.name}</p>}
                <Field name="documentFile" validate={ReduxValidation.required} component={(props: any) => <RenderFile {...props} />} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-6">
          <div className="detail field">
            <label htmlFor="">* Certificate Expire Date (dd/mm/yyyy)</label>
            <Field
              name="expire"
              component={renderField}
              className="form-control"
              type="date"
              validate={ReduxValidation.required}
              placeholder="dd/mm/yyyy"
            />
          </div>
        </div>
        <div className="col-12">
          <div className="text-center">
            <Button color="success" type="submit">Upload</Button>
          </div>
        </div>
      </div>
    </form>
  )
}

const HRIForm = (props: any): JSX.Element => {
  const { handleSubmit, highIngredientList } = props;
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <div className="detail field">
          <p className="mb-3">An Import Health Certificate and a Resuls of Sampling document are both required for each ingredient</p>
        </div>
        <div className="row">
          <div className="col-6 mb-3">
            <div className="detail field">
              <label className="left-group bold">* High Risk Ingredient</label>
              <Field name="highRiskIngredients" component={(childProps: any) => {
                return <Dropdown
                  defaultValue={props.highRiskIngredients}
                  placeholder='Select High Risk Ingredient'
                  fluid
                  search
                  selection
                  multiple
                  onChange={(e, { name, value }) => childProps.input.onChange(value)}
                  options={highIngredientList}
                />
              }}
              />
            </div>
          </div>
          <div className="col-6 mb-3">
            <div className="detail field">
              <label className="left-group bold">* Document type</label>
              <Field name="certType" component={(childProps: any) => {
                return <Dropdown
                  defaultValue={props.certType}
                  label="Document type"
                  placeholder='Select Document type'
                  fluid
                  search
                  selection
                  onChange={(e, { name, value }) => childProps.input.onChange(value)}
                  options={[{
                    text: "Import Health Certificate", value: "IHC"
                  }, {
                    text: "Results of Sampling", value: "RSA"
                  }]}
                />
              }}
              />
            </div>
          </div>
          <div className="col-6 mb-3">
            <div className="detail field">
              <Field
                label="*Supplier Batch number"
                name="batchNumber"
                component={renderField}
                className="form-control"
                type="text"
                validate={ReduxValidation.required}
                placeholder="Batch number"
              />
            </div>
          </div>
          <div className="col-6 mb-3">
            <div className="detail field">
              <label className="left-group bold">Attachment</label>
              <div className="col-12">
                <div>
                  {!props.documentFile && <p style={{ color: "#969292", fontSize: "12px" }}>There is nothing attached</p>}
                  {props.documentFile && <p style={{ color: "#969292", fontSize: "12px" }}>{props.documentFile.name}</p>}
                  <Field name="documentFile" validate={ReduxValidation.required} component={(props: any) => <RenderFile {...props} />} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="text-center">
              <Button color="success" type="submit">Upload</Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export const SKUDetailsReduxForm = reduxForm({ form: 'SKUDetails' })(SKUDetailsForm);
export const PoaoReduxForm = reduxForm({ form: 'PoaoForm' })(PoaoForm)

const selector = formValueSelector('OrganicForm')
export const OrganicReduxForm = connect(
  state => {
    return {
      documentFile: selector(state, 'documentFile')
    }
  }
)(reduxForm({ form: 'OrganicForm' })(OrganicForm))

const selectorHRIForm = formValueSelector('HRIForm')
export const HRIReduxForm = connect(
  (state: any) => {
    const { supplierAssets: { highIngredientList } } = state.supplier;
    return {
      documentFile: selectorHRIForm(state, 'documentFile'),
      certType: selectorHRIForm(state, 'certType'),
      highRiskIngredients: selectorHRIForm(state, 'highRiskIngredients'),
      highIngredientList,
    }
  }
)(reduxForm({ form: 'HRIForm' })(HRIForm))
