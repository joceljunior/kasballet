import Parse from 'parse'

/**
 * Base Repository class
 * Provides common CRUD operations for Parse objects
 */
export class BaseRepository {
  constructor(className) {
    this.className = className
    this.ParseObject = Parse.Object.extend(className)
  }

  /**
   * Find all records with pagination
   * @param {number} limit - Number of records to fetch
   * @param {number} skip - Number of records to skip
   * @param {object} filters - Query filters
   * @param {array} includes - Relations to include
   * @returns {Promise<Parse.Object[]>}
   */
  async findAll(limit = 30, skip = 0, filters = {}, includes = []) {
    const query = new Parse.Query(this.ParseObject)
    
    // Apply filters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (key.includes('.')) {
          // Handle nested queries
          const [relation, field] = key.split('.')
          query.include(relation)
          query.equalTo(`${relation}.${field}`, filters[key])
        } else {
          query.equalTo(key, filters[key])
        }
      }
    })
    
    // Include relations
    includes.forEach(include => {
      query.include(include)
    })
    
    query.limit(limit)
    query.skip(skip)
    
    return query.find()
  }

  /**
   * Find record by ID
   * @param {string} id - Object ID
   * @param {array} includes - Relations to include
   * @returns {Promise<Parse.Object>}
   */
  async findById(id, includes = []) {
    const query = new Parse.Query(this.ParseObject)
    
    includes.forEach(include => {
      query.include(include)
    })
    
    return query.get(id)
  }

  /**
   * Create new record
   * @param {object} data - Data to create
   * @returns {Promise<Parse.Object>}
   */
  async create(data) {
    const object = new this.ParseObject()
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        object.set(key, data[key])
      }
    })
    
    return object.save()
  }

  /**
   * Update record
   * @param {string} id - Object ID
   * @param {object} data - Data to update
   * @returns {Promise<Parse.Object>}
   */
  async update(id, data) {
    const object = await this.findById(id)
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        object.set(key, data[key]) // permite null para limpar campos opcionais (ex: teacherId)
      }
    })
    
    return object.save()
  }

  /**
   * Delete record
   * @param {string} id - Object ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const object = await this.findById(id)
    return object.destroy()
  }

  /**
   * Count records with filters
   * @param {object} filters - Query filters
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        query.equalTo(key, filters[key])
      }
    })
    
    return query.count()
  }
}
