import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import classnames from 'classnames/bind';
import Link from 'gatsby-link';

import leftArrow from './left-arrow.svg';
import rightArrow from './right-arrow.svg';
import styles from './product.module.styl';
import './product.styl';
import {
  clickOnAddToCart,
  currentImageSelector,
  currentQuantitySelector,
  currentSizeSelector,
  currentSizeChanged,
  quantityChanged,
  thumbnailClicked,
  productMounted,
  productChanged,
  clickOnProductDetails,
} from './redux';
import { showProductModalSelector } from '../Products/redux';
import Selector from '../Selector';
import { itemsMapSelector } from '../Cart/redux';
import FAQ from '../FAQ';

const cx = classnames.bind(styles);
const createHandlerMemo = _.memoize((value, handler) => () => handler(value));
const getCommerceMeta = ({ data: { jamProduct: { images } } }) => ({
  image: images.front,
});
const getGoCommerceData = (
  _,
  { data: { jamProduct: { sku, name, prices, path } } },
) => ({
  path,
  prices,
  sku,
  title: name,
  type: 'shoe',
});

const mapStateToProps = createSelector(
  getGoCommerceData,
  currentQuantitySelector,
  currentImageSelector,
  currentSizeSelector,
  itemsMapSelector,
  showProductModalSelector,
  (
    gocommerceData,
    currentQuantity,
    currentImage,
    currentSize,
    itemsMap,
    showingProductModal,
  ) => ({
    currentImage,
    currentCartQuantity: (itemsMap[gocommerceData.sku] || {}).quantity,
    currentQuantity,
    gocommerceData,
    currentSize,
    isSubmitDisabled: !currentSize,
    showingProductModal: !!showingProductModal,
  }),
);

const mapDispatchToProps = (dispatch, props) => {
  const { data: { jamProduct: { thumbnails, sizes } } } = props;

  const sizeHandlers = bindActionCreators(
    sizes.reduce((s, size) => {
      s[size] = createHandlerMemo(size, currentSizeChanged);
      return s;
    }, {}),
    dispatch,
  );

  const thumbnailHandlers = bindActionCreators(
    _.reduce(
      thumbnails,
      (s, _, side) => {
        s[side] = createHandlerMemo(side, thumbnailClicked);
        return s;
      },
      {},
    ),
    dispatch,
  );

  return {
    dispatch,
    sizeHandlers,
    thumbnailHandlers,
    clickOnProductDetails: () => dispatch(clickOnProductDetails()),
    quantityChanged: x =>
      dispatch(quantityChanged((x && x.value) || undefined)),
    productMounted: n => dispatch(productMounted(n)),
    productChanged: n => dispatch(productChanged(n)),
  };
};

const mergeProps = (stateProps, { dispatch, ...dispatchProps }, ownProps) => {
  const { gocommerceData } = stateProps;
  const commerceMeta = getCommerceMeta(ownProps);
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    clickOnAddToCart: () =>
      dispatch(
        clickOnAddToCart({
          ...gocommerceData,
          meta: {
            ...commerceMeta,
            size: stateProps.currentSize,
          },
          quantity: stateProps.currentQuantity,
        }),
      ),
  };
};

export const productFragments = graphql`
  fragment Product_page on JAMProduct {
    name
    sku
    path
    slug
    prices {
      amount
      currency
    }
    maxQuantity
    sale
    description
    details
    sizes
    thumbnails {
      front {
        alt
        src
        srcSet
      }
      back {
        alt
        src
        srcSet
      }
      side {
        alt
        src
        srcSet
      }
    }
    images {
      front {
        alt
        src
        srcSet
      }
      back {
        alt
        src
        srcSet
      }
      side {
        alt
        src
        srcSet
      }
    }
  }
`;

const propTypes = {
  clickOnAddToCart: PropTypes.func.isRequired,
  currentCartQuantity: PropTypes.number,
  currentQuantity: PropTypes.number,
  currentImage: PropTypes.string,
  currentSize: PropTypes.number,
  data: PropTypes.shape({
    jamProduct: PropTypes.shape({
      slug: PropTypes.string,
      description: PropTypes.string,
      details: PropTypes.arrayOf(PropTypes.string),
      images: PropTypes.shape({
        back: PropTypes.object,
        front: PropTypes.object,
        side: PropTypes.object,
      }),
      name: PropTypes.string,
      prices: PropTypes.array,
      sale: PropTypes.string,
      sizes: PropTypes.arrayOf(PropTypes.number).isRequired,
      thumbnails: PropTypes.shape({
        back: PropTypes.object,
        front: PropTypes.object,
        side: PropTypes.object,
      }),
    }).isRequired,
  }).isRequired,
  gocommerceData: PropTypes.object,
  isSubmitDisabled: PropTypes.bool,
  sizeHandlers: PropTypes.object,
  thumbnailHandlers: PropTypes.object,
  quantityChanged: PropTypes.func.isRequired,
  productMounted: PropTypes.func.isRequired,
  productChanged: PropTypes.func.isRequired,
  showBackToShoes: PropTypes.bool,
  showingProductModal: PropTypes.bool,
  clickOnProductDetails: PropTypes.func,
};

export class Product extends PureComponent {
  componentDidMount() {
    this.props.productMounted(this.props.currentCartQuantity);
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.gocommerceData.sku !== nextProps.gocommerceData.sku) {
      this.props.productChanged(nextProps.currentCartQuantity);
    }
  }
  render() {
    const {
      clickOnAddToCart,
      currentImage,
      currentQuantity,
      currentSize,
      data: {
        jamProduct: {
          description,
          details,
          images,
          name,
          maxQuantity = 4,
          prices,
          sale,
          sizes,
          thumbnails = {},
          slug,
        },
      },
      gocommerceData,
      isSubmitDisabled,
      sizeHandlers,
      thumbnailHandlers,
      quantityChanged,
      showBackToShoes = true,
      showingProductModal,
      clickOnProductDetails,
    } = this.props;
    const isSale = !!sale;
    const Price = isSale ? 'del' : 'span';
    const _sale = isSale
      ? <span className={cx('sale')}>
          ${sale}
        </span>
      : null;
    return (
      <React.Fragment>
        <div className={cx('product')}>
          <script
            className="gocommerce-product"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(gocommerceData) }}
            type="application/json"
          />
          <div className={cx('content')}>
            <div className={cx('images')}>
              <div>
                <img
                  alt="alt is set by content"
                  className={cx('main')}
                  {...images[currentImage]}
                />
              </div>
              <div className={cx('thumbnails')}>
                {_.map(thumbnails, ({ alt, ...rest }, side) =>
                  <div
                    key={side}
                    onClick={thumbnailHandlers[side]}
                    onKeyDown={thumbnailHandlers[side]}
                    role="button"
                    tabIndex="0"
                  >
                    <img alt={alt} {...rest} />
                  </div>,
                )}
              </div>
            </div>
            <div className={cx('details')}>
              <header>
                <h1>
                  {name}
                </h1>
              </header>
              <div className={cx('price')}>
                <Price>${prices[0].amount}</Price> {_sale}
              </div>
              <div className={cx('description')}>
                {description}
              </div>
              {!showingProductModal
                ? <ul className={cx('list')}>
                    {details.map(detail =>
                      <li key={detail}>
                        <small>
                          {detail}
                        </small>
                      </li>,
                    )}
                  </ul>
                : <Link
                    to={`/women/shoes/${slug}`}
                    onClick={clickOnProductDetails}
                  >
                    View Full Product Details{' '}
                    <img
                      alt="A small right pointing arrow"
                      className={cx('right-arrow')}
                      src={rightArrow}
                    />
                  </Link>}
              <hr />
              <div className={cx('sizes')}>
                <p>Size:</p>{' '}
                {sizes.map(value =>
                  <button
                    className={cx(
                      'button-size',
                      currentSize === value ? 'selected' : '',
                    )}
                    key={value}
                    onClick={sizeHandlers[value]}
                  >
                    {value}
                  </button>,
                )}
              </div>
              <div className={cx('quantity')}>
                <div className={cx('copy')}>Quantity </div>
                <Selector
                  className={cx('quantity-selector', 'selector')}
                  maxQuantity={maxQuantity}
                  onChange={quantityChanged}
                  value={currentQuantity}
                />
                <div className={cx('submit-content')}>
                  {isSubmitDisabled
                    ? <small className={cx('submit-warning')}>
                        Please select a size
                      </small>
                    : null}
                  <button
                    className={cx('button', isSubmitDisabled ? 'disabled' : '')}
                    disabled={isSubmitDisabled}
                    onClick={clickOnAddToCart}
                    type="submit"
                  >
                    Add To Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
          {showBackToShoes
            ? <Link to="/women/shoes">
                <div className={cx('back')}>
                  <img
                    alt="A smal left pointing arrow"
                    className={cx('left-arrow')}
                    src={leftArrow}
                  />
                  Back to Shoes
                </div>
              </Link>
            : null}
        </div>
        {showBackToShoes && <FAQ type="products" />}
      </React.Fragment>
    );
  }
}

Product.displayName = 'Product';
Product.propTypes = propTypes;

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(
  Product,
);
