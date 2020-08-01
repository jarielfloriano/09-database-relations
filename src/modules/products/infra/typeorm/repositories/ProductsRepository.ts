import AppError from '@shared/errors/AppError';
import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const paramsIn = products.map(product => product.id);

    const findProducts = await this.ormRepository.find({
      where: {
        id: In(paramsIn),
      },
    });

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const selectedProducts = await this.ormRepository.findByIds(
      products.map(product => product.id),
    );

    selectedProducts.forEach(item => {
      const quantityOrder =
        products.find(prod => prod.id === item.id)?.quantity || 0;

      if (item.quantity - quantityOrder < 0) {
        throw new AppError('Insufficient quantity for order');
      }
    });

    const updatedProducts = selectedProducts.map(item => ({
      ...item,
      quantity: Number(
        item.quantity -
          (products.find(prod => prod.id === item.id)?.quantity || 0),
      ),
    }));

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
