import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

interface Product {
  product_id: string;
  sku: string;
  vendor_code: string;
  name: string;
  url: string;
  description: string;
  description1: string;
  option1_name: string;
  option1_value: string;
  option2_name: string;
  option2_value: string;
  price: number;
  quantity: number;
  price_with_discount: number;
  visible: string;
  category: string;
  subcategory: string;
  full_url: string;
  img_url: string;
}

const searchProducts = async ({
  query,
  category,
  maxPrice,
  minPrice,
  limit = 10,
  logger,
}: {
  query?: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  limit?: number;
  logger?: IMastraLogger;
}): Promise<Product[]> => {
  logger?.info("🔧 [ProductSearchTool] Starting product search", {
    query,
    category,
    maxPrice,
    minPrice,
    limit,
  });

  try {
    // Читаем CSV файл - используем абсолютный путь от корня проекта
    const projectRoot = path.resolve(__dirname, "../../../");
    const csvPath = path.join(projectRoot, "src/data/products.csv");
    logger?.info("🔧 [ProductSearchTool] Trying to read CSV from path:", csvPath);
    const csvData = fs.readFileSync(csvPath, "utf-8");
    
    logger?.info("📝 [ProductSearchTool] CSV file loaded successfully");

    // Парсим CSV с правильной обработкой кавычек
    const lines = csvData.split("\n");
    const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
    
    const products: Product[] = [];
    
    // Функция для парсинга CSV строки с обработкой кавычек
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] === ',')) {
          inQuotes = true;
        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
          inQuotes = false;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < 15) continue;
      
      try {
        const product: Product = {
          product_id: values[0]?.replace(/"/g, "") || "",
          sku: values[1]?.replace(/"/g, "") || "",
          vendor_code: values[2]?.replace(/"/g, "") || "",
          name: values[3]?.replace(/"/g, "") || "",
          url: values[4]?.replace(/"/g, "") || "",
          description: values[5]?.replace(/"/g, "") || "",
          description1: values[6]?.replace(/"/g, "") || "",
          option1_name: values[7]?.replace(/"/g, "") || "",
          option1_value: values[8]?.replace(/"/g, "") || "",
          option2_name: values[9]?.replace(/"/g, "") || "",
          option2_value: values[10]?.replace(/"/g, "") || "",
          price: parseFloat(values[11]?.replace(/"/g, "") || "0"),
          quantity: parseInt(values[12]?.replace(/"/g, "") || "0"),
          price_with_discount: parseFloat(values[13]?.replace(/"/g, "") || "0"),
          visible: values[14]?.replace(/"/g, "") || "",
          category: values[15]?.replace(/"/g, "") || "",
          subcategory: values[16]?.replace(/"/g, "") || "",
          full_url: values[17]?.replace(/"/g, "") || "",
          img_url: values[18]?.replace(/"/g, "") || "",
        };
        
        products.push(product);
      } catch (error) {
        logger?.warn("⚠️ [ProductSearchTool] Error parsing product line", { line: i, error });
        continue;
      }
    }

    logger?.info("📝 [ProductSearchTool] Parsed products", { totalProducts: products.length });

    // Фильтрация товаров
    let filteredProducts = products.filter(product => product.visible === "y");
    
    logger?.info("📝 [ProductSearchTool] After visibility filter", {
      visibleProducts: filteredProducts.length,
      sampleProduct: filteredProducts[0] ? {
        name: filteredProducts[0].name,
        category: filteredProducts[0].category,
        visible: filteredProducts[0].visible
      } : null
    });

    // Поиск по запросу
    if (query) {
      const searchQuery = query.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery) ||
        product.description.toLowerCase().includes(searchQuery) ||
        product.category.toLowerCase().includes(searchQuery) ||
        product.subcategory.toLowerCase().includes(searchQuery)
      );
      logger?.info("📝 [ProductSearchTool] After query filter", {
        queryFilteredProducts: filteredProducts.length,
        query: searchQuery
      });
    }

    // Фильтр по категории
    if (category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category.toLowerCase().includes(category.toLowerCase()) ||
        product.subcategory.toLowerCase().includes(category.toLowerCase())
      );
      logger?.info("📝 [ProductSearchTool] After category filter", {
        categoryFilteredProducts: filteredProducts.length,
        category: category
      });
    }

    // Фильтр по цене (применяем только если значение больше 0)
    if (minPrice !== undefined && minPrice > 0) {
      filteredProducts = filteredProducts.filter(product => 
        (product.price_with_discount > 0 ? product.price_with_discount : product.price) >= minPrice
      );
      logger?.info("📝 [ProductSearchTool] After minPrice filter", {
        minPriceFilteredProducts: filteredProducts.length,
        minPrice: minPrice
      });
    }

    if (maxPrice !== undefined && maxPrice > 0) {
      filteredProducts = filteredProducts.filter(product => 
        (product.price_with_discount > 0 ? product.price_with_discount : product.price) <= maxPrice
      );
      logger?.info("📝 [ProductSearchTool] After maxPrice filter", {
        maxPriceFilteredProducts: filteredProducts.length,
        maxPrice: maxPrice
      });
    }

    // Ограничиваем количество результатов
    const result = filteredProducts.slice(0, limit);

    logger?.info("✅ [ProductSearchTool] Search completed", {
      foundProducts: result.length,
      totalFilteredProducts: filteredProducts.length,
    });

    return result;
  } catch (error) {
    logger?.error("❌ [ProductSearchTool] Error searching products", { error });
    throw error;
  }
};

export const productSearchTool = createTool({
  id: "search-products",
  description: "Поиск товаров в базе данных магазина очков по названию, категории и цене",
  inputSchema: z.object({
    query: z.string().optional().describe("Поисковый запрос по названию или описанию товара"),
    category: z.string().optional().describe("Категория товара (например, 'солнцезащитные', 'компьютерные')"),
    maxPrice: z.number().optional().describe("Максимальная цена"),
    minPrice: z.number().optional().describe("Минимальная цена"),
    limit: z.number().optional().default(10).describe("Максимальное количество результатов (по умолчанию 10)"),
  }),
  outputSchema: z.object({
    products: z.array(z.object({
      product_id: z.string(),
      name: z.string(),
      price: z.number(),
      price_with_discount: z.number(),
      category: z.string(),
      subcategory: z.string(),
      description: z.string(),
      quantity: z.number(),
      img_url: z.string(),
      full_url: z.string(),
    })),
    total_found: z.number(),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [ProductSearchTool] Starting execution", { context });
    
    const products = await searchProducts({
      query: context.query,
      category: context.category,
      maxPrice: context.maxPrice,
      minPrice: context.minPrice,
      limit: context.limit,
      logger,
    });

    return {
      products: products.map(p => ({
        product_id: p.product_id,
        name: p.name,
        price: p.price,
        price_with_discount: p.price_with_discount,
        category: p.category,
        subcategory: p.subcategory,
        description: p.description.replace(/<[^>]*>/g, "").substring(0, 200) + "...", // Убираем HTML теги
        quantity: p.quantity,
        img_url: p.img_url,
        full_url: p.full_url,
      })),
      total_found: products.length,
    };
  },
});