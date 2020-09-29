import React, { Component } from 'react';
import ImageWithText from '../general/ImageWithText';
import { camelCaseToWords, reorderObject, validateDate } from "../../_helpers/helper";
import { keyWithDisplayName } from '../general/DisplayName';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getLocalTime } from '../../util';
import { includes, isNull } from "lodash";
import { FILE_LINK } from '../../constants';
import { Link } from 'react-router-dom';
import { ITab } from '../tabs/Tabs';



export const hiddedFileds: string[] = ["_id", "__v", "modified", "version", "certificates"];
const textAreaFields: string[] = ["generalDescription", "description", "metaDescription"];
const notEditableFields: string[] = ["origin", "productId", "skuId", "createdAtTime", "lastUpdatedDateTime", "bulk", "category", "bulkDesc", "animalOrigin", "HCs", "IHC", "COA", "CVED", "COI", "CED", "supplier", "suppliersAffected", "suppliersOK", "paperworkRequiredForCED", "resultsOfSampling"];
const mediaAttOrder = ['mediaDescription', 'mediaType', 'isDefault', 'url', 'dimensionsHeight', 'dimensionsWidth', 'resolution'];


const isOriginTab = (tabs: ITab[], tab: number, pKey: Array<string>, value: any, item: any) => {
  return ((pKey.slice(-1)[0] === 'origin_products' && value[item] && value[item].origin.toUpperCase() === tabs[tab].slug) || pKey.slice(-1)[0] !== 'origin_products')
}

const isMediaEntityList = (pKey: Array<string>, value: any) => (
  value.hasOwnProperty("mediaEntityList")
)

export const isArrayOfObject = (value: any) => (
  Array.isArray(value) && typeof value[0] === 'object'
)

export const isArrayOfString = (value: any) => (
  Array.isArray(value) && typeof value[0] === 'string'
)

export const isArray = (value: any) => (
  Array.isArray(value)
)

export const isObject = (value: any) => (
  typeof value === "object" && value !== null
)


interface RecursiveFieldProps {
  value: any;
  pKey: Array<string>;
  showEditView: boolean;
  editable: boolean;
  handleChange?: Function;
  tabs: ITab[]
  tab: number;
}

interface IProductView {
  product: any;
  showEditView: boolean;
  editable: boolean;
  handleChange?: Function;
  tabs: ITab[]
  tab: number;
  certLinkClick: Function;
  editViewForDoc: Function;
}

interface RecursiveFieldState {
  slideIndex: number;
  slideNumber?: number;
}

export const ProductView = (props: IProductView) => {
  return (<div className="col-sm-12">{
    props.tabs.length &&
    <div className="row">
      {Object.keys(props.product).map((key: string, index: number) => {
        if (key === 'label') {
          return (<div key={`cert-${index}`} className={'col-md-' + (props.tab === 0 ? '6' : '12')}>
            <div className="form-group raw-view">
              <h6>Label</h6>{renderFileLink(props.product[key], props.certLinkClick)}
            </div>
          </div>
          )
        } else if (hiddedFileds.indexOf(key) === -1
          && ((props.tabs[props.tab].slug === "COMMON" && key !== 'origin_products') || (props.tabs[props.tab].slug !== "COMMON" && key === 'origin_products'))) {
          return (
            <div className={'col-md-' + (props.tabs[props.tab].slug === "COMMON" ? '6' : '12')} key={index}>
              <div className={`form-group${props.showEditView && props.editable ? ' edit-view' : ' raw-view'}`} >
                <h6>{keyWithDisplayName[key] || camelCaseToWords(key)}</h6>
                {isObject(props.product[key]) && <ShowRecursiveFields value={props.product[key]} pKey={[key]} showEditView={props.showEditView} editable={props.editable} handleChange={props.handleChange} tabs={props.tabs} tab={props.tab} />}
                {!isObject(props.product[key]) && <div className="detail field"><ViewField skey={[key]} value={[props.product[key]]} showEditView={props.showEditView} editable={props.editable} handleChange={props.handleChange} tabs={props.tabs} tab={props.tab} /></div>}
              </div>
            </div>
          )
        }
        return undefined;
      })}
    </div>}
  </div>
  )
}

class Slider extends Component<RecursiveFieldProps, RecursiveFieldState> {
  constructor(props: any) {
    super(props);
    this.state = {
      slideIndex: 1
    }
  }

  plusSlides(n: number) {
    let slideNumber = this.state.slideIndex + n;
    this.setState({ slideIndex: slideNumber }, () => {
      this.showSlides(this.state.slideIndex);
    })
  }

  showSlides(n: number) {
    var i;
    const imgSlides: any = this.refs.imgContainer;
    if (imgSlides) {
      const slides = imgSlides.getElementsByClassName("mySlides")

      if (n > slides.length) { this.setState({ slideIndex: 1 }) }
      if (n < 1) {
        this.setState({ slideIndex: slides.length })
      }
      for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
      }
      let slideNumber = this.state.slideIndex;
      slides[slideNumber - 1].style.display = "block";
    }
  }

  componentDidMount() {
    this.showSlides(this.state.slideIndex);
  }

  render() {
    let { value } = this.props;
    return <>
      <div className="col-sm-6">
        <h5 className='align-items-center'>Media (in-feed)</h5>
        {value['mediaEntityList'] && value['mediaEntityList'].length > 0 &&
          <React.Fragment>
            <div className="slideshow-container" ref="imgContainer" id="media_slider_top">
              {Object.keys(value['mediaEntityList']).map((k: string, index: number) => {
                let orderedObject = reorderObject(value['mediaEntityList'][index], mediaAttOrder);
                return (
                  <div className="mySlides" ref="imgSlide" key={k}>
                    <ImageWithText skuData={value['mediaEntityList']['skuId']} imageUrl={value['mediaEntityList'][index]['url']} />
                    {(Object.keys(orderedObject).map((k: string, j: number) => {
                      return (<div className={`detail field${value['mediaEntityList'] ? '' : ' blank'}`} key={k}>
                        <label><b>{keyWithDisplayName[k] || camelCaseToWords(k)} </b> </label>
                        {k === 'url' && <a target="_blank" rel="noopener noreferrer" href={value['mediaEntityList'][index][k]}>&nbsp;{value['mediaEntityList'][index][k].replace(/^.*\/\/[^/]+/, '')}</a>}
                        {k !== 'url' && ' ' + value['mediaEntityList'][index][k]}

                      </div>)
                    })
                    )}
                  </div>
                )
              })
              }
              {this.state.slideIndex > 1 &&
                <button className="btn btn-link prev" onClick={e => this.plusSlides(-1)}>&#10094;</button>
              }
              {value['mediaEntityList'].length > this.state.slideIndex &&
                <button className="btn btn-link next" onClick={e => this.plusSlides(1)}>&#10095;</button>
              }

            </div>
          </React.Fragment>}
      </div>
    </>
  }
}

export const ShowRecursiveFields = (props: RecursiveFieldProps) => {

  let { value, pKey, ...rest } = props;
  const handleInnerObjects = (event: any) => {
    const getName = event.target.id || event.target.parentElement.id || event.target.parentElement.parentElement.id;
    let getCompoenent: any = document.getElementById('field_' + getName);
    let iconCompoenent: any = document.getElementsByClassName('icon_' + getName);
    if (getCompoenent.classList.contains('d-none')) {
      iconCompoenent[0].classList.add('d-none')
      iconCompoenent[1].classList.remove('d-none')
      getCompoenent.classList.remove('d-none')
    } else {
      getCompoenent.classList.add('d-none')
      iconCompoenent[1].classList.add('d-none')
      iconCompoenent[0].classList.remove('d-none')
    }
  }

  let SubView = Object.keys(value).map((item: any, index: number) => {
    let child = [...pKey, item];
    return (
      <React.Fragment key={`recursive-` + item}>
        {isOriginTab(rest.tabs, rest.tab, pKey, value, item) && isObject(value[item]) && value[item] && <div className="form-group">
          <div className="detail field"><b> {keyWithDisplayName[item] || camelCaseToWords(item)}</b></div>
          <ShowRecursiveFields value={value[item]} pKey={child} {...rest} />
        </div>}
        {
          (!isObject(value[item]) || !value[item])
          && hiddedFileds.indexOf(item) === -1 && <div className="detail field">
            <b>{keyWithDisplayName[item] || camelCaseToWords(item)}</b>
            {isArray(value[item])
              ? value[item].join(', ')
              : <ViewField skey={child} value={[value[item]]} {...rest} />}
          </div>
        }
      </React.Fragment>
    )
  })
  return (
    <>
      <span id={[...pKey].join("-")} className={(Array.isArray(value) || /^origin_products/.test(pKey.slice(-2)[0])) ? 'd-none' : ''} onClick={handleInnerObjects}>
        <FontAwesomeIcon icon="plus-square" size="1x" className={`iconClass icon_${[...pKey].join("-")} d-none`} />
        <FontAwesomeIcon icon="minus-square" size="1x" className={`iconClass icon_${[...pKey].join("-")} `} />
      </span>
      <div id={`field_${[...pKey].join("-")}`} className={Array.isArray(value) ? '' : "pl-3 "}>
        <div className={isMediaEntityList(pKey, value) ? "row" : ""}>
          {
            isMediaEntityList(pKey, value) && <div className="col-sm-6">{SubView}</div>
          }
          {
            !isMediaEntityList(pKey, value) && SubView
          }
          {
            isMediaEntityList(pKey, value) && <Slider value={value} pKey={pKey} {...rest} />
          }
        </div>
      </div>
    </>
  )
}

const renderFileLink = (fileLink: FILE_LINK, onClickFunction: Function): JSX.Element => {
  return <a href="javascript.void(0);" className='fileLinkS3' onClick={e => onClickFunction(e, fileLink.fileLink)} ><b>{fileLink.fileName}</b>
  </a>;
};

export const renderPDFPreviewLink = (fileLink: FILE_LINK, onClickFunction?: Function): JSX.Element => {
  return <Link to={`/renderPdf/${btoa(fileLink.fileLink)}`} target="_blank" ><b>{fileLink.fileName}</b></Link>
};

export const ViewField = (props: any) => {
  let { skey, showEditView, handleChange } = props;
  let value = props.value[0]
  return (<>
    {hiddedFileds.indexOf(skey.slice(-1)[0]) === -1 && !showEditView && <div dangerouslySetInnerHTML={{ __html: (skey.slice(-1)[0] === 'skuId' ? value : validateDate(value) ? getLocalTime(value) : Array.isArray(value) ? value.join(', ') : String(value)) }} />}
    {hiddedFileds.indexOf(skey.slice(-1)[0]) === -1 && showEditView && <>
      {typeof value === "boolean" && <input className="ui ui-checkbox" type="checkbox" checked={value}
        onChange={event =>
          handleChange({
            key: skey,
            value: value
          })} disabled={(notEditableFields.indexOf(skey.slice(-1)[0]) > -1 || includes(skey, 'certificateInfo'))}
      />
      }
      {value !== "boolean" && textAreaFields.indexOf(skey.slice(-1)[0]) < 0 && <input
        onChange={event =>
          handleChange({
            key: skey,
            value: event.target.value
          })}
        className="form-control" disabled={(notEditableFields.indexOf(skey.slice(-1)[0]) > -1 || includes(skey, 'certificateInfo'))} value={isNull(value) ? '' : value} />
      }
      {typeof value !== "object" && value !== "boolean" && textAreaFields.indexOf(skey.slice(-1)[0]) > -1 && <textarea
        onChange={event =>
          handleChange({
            key: skey,
            value: event.target.value
          })}
        className="form-control noresize" disabled={(notEditableFields.indexOf(skey.slice(-1)[0]) > -1 || includes(skey, 'certificateInfo'))} value={isNull(value) ? '' : value} />
      }
    </>}
  </>)
}
