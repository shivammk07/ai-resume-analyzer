package com.careerpulse.dao;

import com.careerpulse.exception.DatabaseOperationException;

import java.util.List;
import java.util.Optional;

/**
 * Generic Data Access Object (DAO) interface using Java Generics for typed CRUD operations.
 */
public interface GenericDao<T, ID> {
    T save(T entity) throws DatabaseOperationException;

    Optional<T> findById(ID id) throws DatabaseOperationException;

    List<T> findAll() throws DatabaseOperationException;

    boolean deleteById(ID id) throws DatabaseOperationException;
}
