import next, { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiUser, FiCalendar } from 'react-icons/fi';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results, next_page } = postsPagination;
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function handleNextPage(): Promise<any> {
    try {
      await fetch(nextPage)
        .then(response => response.json())
        .then(data => {
          console.log('DATA ', data);
          setNextPage(data.next_page);
          setPosts([...posts, ...data.results]);
        });
    } catch (err) {
      console.log('Error', err.message);
    }
  }

  return (
    <>
      <Head>
        <title>Home | SpaceTravelling</title>
      </Head>
      <Header />
      <main className={commonStyles.Container}>
        <div className={styles.Post}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.Informations}>
                  <div>
                    <FiCalendar size={20} />
                    <time>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        { locale: ptBR }
                      )}
                    </time>
                  </div>
                  <div>
                    <FiUser size={20} />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <button type="button" className={styles.ButtonLoading} onClick={handleNextPage}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  // console.log(JSON.stringify(postsResponse, null, 2));

  const next_page = postsResponse.next_page;

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: { results, next_page },
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
